/**
 * One-time (and re-runnable) importer: WordPress WXR export → the Postgres
 * `posts` table (see scripts/db-schema.sql). Upserts by slug.
 *
 * Usage:
 *   npx tsx scripts/import-wordpress.ts path/to/export.xml
 *
 * Only items with wp:post_type=post and wp:status=publish are imported.
 * Featured images are downloaded into public/images/blog/ (requires a
 * redeploy to go live, since that folder is a static build asset).
 *
 * NOTE: as of this writing, cms.proacademymx.com — including its
 * /wp-content/uploads/ media URLs — is blocked for non-browser requests by
 * the host's Imunify360 bot-protection (see project history). Until that's
 * fixed, image downloads here will fail gracefully (post still imports,
 * just without a featured image) and can be backfilled later by re-running
 * this script once the block is lifted.
 */
import { XMLParser } from "fast-xml-parser";
import TurndownService from "turndown";
import { neon } from "@neondatabase/serverless";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  decodeEntities,
  stripInjectedChrome,
  removeFeaturedImageFromContent,
  buildDescription,
  readingTime,
  pickPrimaryCategory,
  type BlogCategory,
} from "../src/lib/wordpress";

const IMAGES_DIR = path.resolve(process.cwd(), "public/images/blog");
const IMAGES_PUBLIC_PREFIX = "/images/blog";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

function loadLocalEnv() {
  for (const name of [".env.local", ".env"]) {
    if (!existsSync(name)) continue;
    for (const line of readFileSync(name, "utf-8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

async function main() {
  const xmlPath = process.argv[2];
  if (!xmlPath) {
    console.error("Usage: npx tsx scripts/import-wordpress.ts path/to/export.xml");
    process.exit(1);
  }

  loadLocalEnv();
  const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL!);

  const xml = readFileSync(xmlPath, "utf-8").replace(/\r\n/g, "\n");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", trimValues: false });

  const doc = parser.parse(xml);
  const items: any[] = asArray(doc?.rss?.channel?.item);
  if (items.length === 0) {
    console.error("No <item> elements found — is this a valid WordPress export XML?");
    process.exit(1);
  }

  const attachmentUrlById = new Map<string, string>();
  for (const item of items) {
    if (item["wp:post_type"] === "attachment" && item["wp:attachment_url"]) {
      attachmentUrlById.set(String(item["wp:post_id"]), String(item["wp:attachment_url"]));
    }
  }

  const posts = items.filter((item) => item["wp:post_type"] === "post" && item["wp:status"] === "publish");
  if (posts.length === 0) {
    console.error("No items with wp:post_type=post and wp:status=publish found.");
    process.exit(1);
  }

  mkdirSync(IMAGES_DIR, { recursive: true });

  let imported = 0;
  let skipped = 0;

  for (const item of posts) {
    try {
      await importOne(item, attachmentUrlById, sql);
      imported++;
    } catch (err) {
      skipped++;
      console.error(`✗ Skipped "${item.title ?? "(sin título)"}": ${(err as Error).message}`);
    }
  }

  console.log(`\nImported ${imported} post(s), skipped ${skipped}.`);
}

async function importOne(item: any, attachmentUrlById: Map<string, string>, sql: ReturnType<typeof neon>) {
  const slug = String(item["wp:post_name"] || "").trim();
  if (!slug) throw new Error("missing wp:post_name (slug)");

  const rawTitle = decodeEntities(String(item.title ?? "").trim()) || "Sin título";

  const categories: BlogCategory[] = asArray(item.category)
    .filter((c: any) => c && c["@_domain"] === "category")
    .map((c: any) => ({
      name: decodeEntities(String(c["#text"] ?? "").trim()),
      slug: String(c["@_nicename"] ?? "").trim(),
    }))
    .filter((c: BlogCategory) => c.name && c.slug);

  const primary = pickPrimaryCategory(categories);
  const featuredUrl = resolveFeaturedImage(item, attachmentUrlById);

  let cleanedHtml = String(item["content:encoded"] ?? "");
  cleanedHtml = stripInjectedChrome(cleanedHtml);
  cleanedHtml = removeFeaturedImageFromContent(cleanedHtml, featuredUrl);

  const description = buildDescription(cleanedHtml, `${rawTitle}. Guía de preparación de Professional Academy.`);
  const markdownBody = turndown.turndown(cleanedHtml).trim();

  // Re-render the Markdown (not the raw WordPress HTML) so heading ids match
  // what the admin-authored posts get, keeping the TOC consistent site-wide.
  const { renderMarkdown, readingTimeFromHtml } = await import("../src/lib/markdown");
  const html = renderMarkdown(markdownBody);
  const minutes = readingTimeFromHtml(html);

  const pubDateRaw = String(item["wp:post_date"] ?? "").trim();
  const pubDate = pubDateRaw ? pubDateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const author = decodeEntities(String(item["dc:creator"] ?? "").trim()) || "Professional Academy";

  let image: string | undefined;
  if (featuredUrl) image = await downloadImage(featuredUrl, slug);

  await sql`
    INSERT INTO posts (
      slug, title, description, category, category_slug, categories,
      pub_date, image, image_alt, author, reading_time, draft, body, html
    ) VALUES (
      ${slug}, ${rawTitle}, ${description}, ${primary.name}, ${primary.slug},
      ${JSON.stringify(categories)}, ${pubDate}, ${image ?? null}, ${image ? rawTitle : ""},
      ${author}, ${minutes}, false, ${markdownBody}, ${html}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, description = EXCLUDED.description,
      category = EXCLUDED.category, category_slug = EXCLUDED.category_slug,
      categories = EXCLUDED.categories, pub_date = EXCLUDED.pub_date,
      image = COALESCE(EXCLUDED.image, posts.image), image_alt = EXCLUDED.image_alt,
      author = EXCLUDED.author, reading_time = EXCLUDED.reading_time,
      body = EXCLUDED.body, html = EXCLUDED.html, updated_at = now()
  `;
  console.log(`✓ ${slug}${image ? " (+ imagen)" : ""}`);
}

function resolveFeaturedImage(item: any, attachmentUrlById: Map<string, string>): string | null {
  const metas = asArray(item["wp:postmeta"]);
  const thumbMeta = metas.find((m: any) => m?.["wp:meta_key"] === "_thumbnail_id");
  if (!thumbMeta) return null;
  const attachmentId = String(thumbMeta["wp:meta_value"] ?? "");
  return attachmentUrlById.get(attachmentId) ?? null;
}

/** Downloads a featured image to public/images/blog/, skipping if already present. */
async function downloadImage(url: string, slug: string): Promise<string | undefined> {
  const ext = (url.split(".").pop()?.split("?")[0] ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${slug}.${ext}`;
  const destPath = path.join(IMAGES_DIR, filename);
  const publicPath = `${IMAGES_PUBLIC_PREFIX}/${filename}`;

  if (existsSync(destPath)) return publicPath;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      throw new Error(`response was not an image (content-type: ${contentType || "unknown"} — likely blocked/challenged)`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(destPath, buffer);
    return publicPath;
  } catch (err) {
    console.error(`  ⚠ Could not download image for "${slug}" (${url}): ${(err as Error).message}`);
    return undefined;
  }
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
