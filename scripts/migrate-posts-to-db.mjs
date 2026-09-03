/**
 * One-time migration: the 9 Markdown posts in src/content/blog/*.mdx → the
 * Postgres `posts` table. Re-runnable (upserts by slug).
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";

function loadLocalEnv() {
  for (const name of [".env.local", ".env"]) {
    if (!existsSync(name)) continue;
    for (const line of readFileSync(name, "utf-8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
}
loadLocalEnv();

function slugify(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function renderMarkdown(markdown) {
  const rawHtml = marked.parse(markdown, { async: false });
  const used = new Set();
  return rawHtml.replace(/<(h[23])>([\s\S]*?)<\/\1>/gi, (full, tag, inner) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return full;
    let slug = slugify(text) || "seccion";
    let n = 2;
    while (used.has(slug)) slug = `${slug}-${n++}`;
    used.add(slug);
    return `<${tag} id="${slug}">${inner}</${tag}>`;
  });
}

function readingTime(html) {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean);
  return Math.max(1, Math.round(words.length / 200));
}

// Tiny frontmatter parser (YAML subset — this project's files only use
// strings, numbers, booleans, dates, and one level of list-of-objects).
function parseFrontmatter(rawInput) {
  const raw = rawInput.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error("No frontmatter block found");
  const [, fmText, body] = match;

  const data = {};
  const lines = fmText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = /^([a-zA-Z]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, rawValue] = kv;

    if (rawValue === "") {
      // Possible list block (categories:)
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s*name:/.test(lines[i + 1])) {
        const nameLine = lines[++i];
        const name = /name:\s*"?(.*?)"?$/.exec(nameLine)[1];
        const slugLine = lines[i + 1];
        const slug = /slug:\s*"?(.*?)"?$/.exec(slugLine)[1];
        i++;
        items.push({ name, slug });
      }
      data[key] = items;
    } else {
      let value = rawValue.trim();
      if (/^".*"$/.test(value)) value = value.slice(1, -1);
      else if (value === "true") value = true;
      else if (value === "false") value = false;
      data[key] = value;
    }
  }
  return { data, body: body.trim() };
}

const CONTENT_DIR = "src/content/blog";
const files = existsSync(CONTENT_DIR) ? readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md")) : [];

if (files.length === 0) {
  console.log("No local posts found in", CONTENT_DIR, "— nothing to migrate.");
  process.exit(0);
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);

let migrated = 0;
for (const file of files) {
  const raw = readFileSync(path.join(CONTENT_DIR, file), "utf-8");
  const { data, body } = parseFrontmatter(raw);
  const slug = file.replace(/\.mdx?$/, "");

  const html = renderMarkdown(body);
  const rt = data.readingTime ? Number(data.readingTime) : readingTime(html);
  const categories = data.categories ?? [{ name: data.category, slug: data.categorySlug }];

  await sql`
    INSERT INTO posts (
      slug, title, description, category, category_slug, categories,
      pub_date, image, image_alt, author, reading_time, draft, body, html
    ) VALUES (
      ${slug}, ${data.title}, ${data.description}, ${data.category}, ${data.categorySlug},
      ${JSON.stringify(categories)}, ${data.pubDate}, ${data.image ?? null}, ${data.imageAlt ?? ""},
      ${data.author ?? "Professional Academy"}, ${rt}, ${data.draft === true}, ${body}, ${html}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      category_slug = EXCLUDED.category_slug,
      categories = EXCLUDED.categories,
      pub_date = EXCLUDED.pub_date,
      image = EXCLUDED.image,
      image_alt = EXCLUDED.image_alt,
      author = EXCLUDED.author,
      reading_time = EXCLUDED.reading_time,
      body = EXCLUDED.body,
      html = EXCLUDED.html,
      updated_at = now()
  `;
  console.log("✓", slug);
  migrated++;
}

console.log(`\nMigrated ${migrated} post(s) into Postgres.`);
