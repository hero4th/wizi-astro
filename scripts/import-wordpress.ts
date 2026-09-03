/**
 * One-time (and re-runnable) importer: WordPress WXR export → local Markdown
 * blog posts under src/content/blog/.
 *
 * Usage:
 *   npx tsx scripts/import-wordpress.ts path/to/export.xml
 *
 * Only items with wp:post_type=post and wp:status=publish are imported.
 * Featured images are downloaded into public/images/blog/.
 * Re-running is safe — it overwrites the .md file for each slug and skips
 * re-downloading an image that's already on disk.
 */
import { XMLParser } from "fast-xml-parser";
import TurndownService from "turndown";
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

const CONTENT_DIR = path.resolve(process.cwd(), "src/content/blog");
const IMAGES_DIR = path.resolve(process.cwd(), "public/images/blog");
const IMAGES_PUBLIC_PREFIX = "/images/blog";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

async function main() {
  const xmlPath = process.argv[2];
  if (!xmlPath) {
    console.error("Usage: npx tsx scripts/import-wordpress.ts path/to/export.xml");
    process.exit(1);
  }

  const xml = readFileSync(xmlPath, "utf-8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // No cdataPropName: leaving it unset merges CDATA content as plain text
    // (which is all WXR uses it for) instead of nesting it under its own key.
    trimValues: false,
  });

  const doc = parser.parse(xml);
  const items: any[] = asArray(doc?.rss?.channel?.item);
  if (items.length === 0) {
    console.error("No <item> elements found — is this a valid WordPress export XML?");
    process.exit(1);
  }

  // Attachment id → URL map, for resolving each post's featured image.
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

  mkdirSync(CONTENT_DIR, { recursive: true });
  mkdirSync(IMAGES_DIR, { recursive: true });

  let imported = 0;
  let skipped = 0;

  for (const item of posts) {
    try {
      await importOne(item, attachmentUrlById);
      imported++;
    } catch (err) {
      skipped++;
      console.error(`✗ Skipped "${item.title ?? "(sin título)"}": ${(err as Error).message}`);
    }
  }

  console.log(`\nImported ${imported} post(s), skipped ${skipped}. Files written to ${CONTENT_DIR}`);
}

async function importOne(item: any, attachmentUrlById: Map<string, string>) {
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

  let html = String(item["content:encoded"] ?? "");
  html = stripInjectedChrome(html);
  html = removeFeaturedImageFromContent(html, featuredUrl);

  const description = buildDescription(html, `${rawTitle}. Guía de preparación de Professional Academy.`);
  const minutes = readingTime(html);
  const markdownBody = turndown.turndown(html).trim();

  const pubDateRaw = String(item["wp:post_date"] ?? "").trim();
  const pubDate = pubDateRaw ? pubDateRaw.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const author = decodeEntities(String(item["dc:creator"] ?? "").trim()) || "Professional Academy";

  const frontmatter: Record<string, unknown> = {
    title: rawTitle,
    description,
    category: primary.name,
    categorySlug: primary.slug,
    categories,
    pubDate,
    author,
    readingTime: minutes,
    draft: false,
  };

  if (featuredUrl) {
    const localPath = await downloadImage(featuredUrl, slug);
    if (localPath) {
      frontmatter.image = localPath;
      frontmatter.imageAlt = rawTitle;
    }
  }

  const fileContents = `---\n${toFrontmatterYaml(frontmatter)}---\n\n${markdownBody}\n`;
  writeFileSync(path.join(CONTENT_DIR, `${slug}.md`), fileContents, "utf-8");
  console.log(`✓ ${slug}.md${featuredUrl ? " (+ imagen)" : ""}`);
}

function resolveFeaturedImage(item: any, attachmentUrlById: Map<string, string>): string | null {
  const metas = asArray(item["wp:postmeta"]);
  const thumbMeta = metas.find((m: any) => m?.["wp:meta_key"] === "_thumbnail_id");
  if (!thumbMeta) return null;
  const attachmentId = String(thumbMeta["wp:meta_value"] ?? "");
  return attachmentUrlById.get(attachmentId) ?? null;
}

/** Downloads a featured image to public/images/blog/, skipping if already present. Returns the public URL path, or undefined on failure. */
async function downloadImage(url: string, slug: string): Promise<string | undefined> {
  const ext = (url.split(".").pop()?.split("?")[0] ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const filename = `${slug}.${ext}`;
  const destPath = path.join(IMAGES_DIR, filename);
  const publicPath = `${IMAGES_PUBLIC_PREFIX}/${filename}`;

  if (existsSync(destPath)) return publicPath;

  try {
    const res = await fetch(url, {
      headers: {
        // The old host has bot-protection in front of it; a plain fetch
        // without a browser-like UA gets a 200 HTML challenge page instead
        // of a 404, so status alone doesn't prove success — content-type
        // below is what actually catches that case.
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

function toFrontmatterYaml(data: Record<string, unknown>): string {
  return Object.entries(data).map(([key, value]) => yamlLine(key, value, 0)).join("\n") + "\n";
}

function yamlLine(key: string, value: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}${key}: []`;
    const items = value
      .map((v) => {
        if (v && typeof v === "object") {
          const entries = Object.entries(v as Record<string, unknown>)
            .map(([k, val], i) => (i === 0 ? `${k}: ${yamlScalar(val)}` : `${pad}    ${k}: ${yamlScalar(val)}`))
            .join("\n");
          return `${pad}  - ${entries}`;
        }
        return `${pad}  - ${yamlScalar(v)}`;
      })
      .join("\n");
    return `${pad}${key}:\n${items}`;
  }
  return `${pad}${key}: ${yamlScalar(value)}`;
}

function yamlScalar(value: unknown): string {
  if (value === undefined || value === null) return '""';
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  const str = String(value);
  // Quote unless it's a "safe" bare word — dates included, so pubDate/updatedDate
  // round-trip as YYYY-MM-DD strings rather than YAML dates.
  if (!/^[\w./-]+$/.test(str) || /^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return JSON.stringify(str);
  }
  return str;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
