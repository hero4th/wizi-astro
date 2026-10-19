/**
 * One-shot setup for a fresh (test/staging) database.
 *
 *   DATABASE_URL_UNPOOLED='postgresql://…' \
 *   ADMIN_PASSWORD_HASH='$2b$12$…' \
 *   node scripts/setup-test-db.mjs
 *
 * Applies scripts/db-schema.sql (idempotent), seeds the admin credentials row
 * from ADMIN_PASSWORD_HASH, and loads the 73 blog posts from
 * src/data/blog-fallback.json as sample content.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("✗ Falta DATABASE_URL_UNPOOLED (o DATABASE_URL) en el entorno.");
  process.exit(1);
}
const sql = neon(url);

// --- 1. Schema -------------------------------------------------------------
const schema = readFileSync(new URL("./db-schema.sql", import.meta.url), "utf8");
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);
for (const stmt of statements) {
  await sql.query(stmt);
}
console.log(`✓ Esquema aplicado (${statements.length} sentencias).`);

// --- 2. Admin credentials --------------------------------------------------
const hash = process.env.ADMIN_PASSWORD_HASH;
if (hash) {
  const rows = await sql`
    INSERT INTO admin_credentials (id, password_hash, sessions_valid_from)
    VALUES (1, ${hash}, now() - interval '1 day')
    ON CONFLICT (id) DO NOTHING
    RETURNING id
  `;
  console.log(rows.length ? "✓ admin_credentials sembrado desde ADMIN_PASSWORD_HASH." : "· admin_credentials ya existía (sin cambios).");
} else {
  console.log("· ADMIN_PASSWORD_HASH no provisto: se omite el seed de credenciales.");
}

// --- 3. Sample blog posts --------------------------------------------------
const posts = JSON.parse(
  readFileSync(new URL("../src/data/blog-fallback.json", import.meta.url), "utf8"),
);

let count = 0;
for (const p of posts) {
  await sql`
    INSERT INTO posts (
      slug, title, description, category, category_slug, categories,
      pub_date, updated_date, image, image_alt, image_width, image_height,
      author, reading_time, draft, body, html, noindex
    ) VALUES (
      ${p.slug}, ${p.title}, ${p.description}, ${p.category}, ${p.categorySlug},
      ${JSON.stringify(p.categories ?? [])}::jsonb,
      ${p.pubDate ? String(p.pubDate).slice(0, 10) : null},
      ${p.updatedDate ? String(p.updatedDate).slice(0, 10) : null},
      ${p.image ?? null}, ${p.imageAlt ?? ""},
      ${p.imageWidth ?? null}, ${p.imageHeight ?? null},
      ${p.author ?? "Professional Academy"}, ${p.readingTime ?? 5},
      ${p.draft ?? true}, ${p.body ?? ""}, ${p.html ?? ""}, ${p.noindex ?? false}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category = EXCLUDED.category,
      category_slug = EXCLUDED.category_slug,
      categories = EXCLUDED.categories,
      pub_date = EXCLUDED.pub_date,
      updated_date = EXCLUDED.updated_date,
      image = EXCLUDED.image,
      image_alt = EXCLUDED.image_alt,
      image_width = EXCLUDED.image_width,
      image_height = EXCLUDED.image_height,
      author = EXCLUDED.author,
      reading_time = EXCLUDED.reading_time,
      draft = EXCLUDED.draft,
      body = EXCLUDED.body,
      html = EXCLUDED.html,
      noindex = EXCLUDED.noindex,
      updated_at = now()
  `;
  count++;
}
console.log(`✓ ${count} posts cargados.`);

// --- 4. Summary ------------------------------------------------------------
const [{ total }] = await sql`SELECT count(*)::int AS total FROM posts`;
const [{ published }] = await sql`SELECT count(*)::int AS published FROM posts WHERE draft = false`;
const cats = await sql`
  SELECT category_slug, count(*)::int AS n
  FROM posts GROUP BY category_slug ORDER BY n DESC
`;
console.log(`\nResumen: ${total} posts (${published} publicados)`);
console.log("Por categoría:", cats.map((c) => `${c.category_slug}:${c.n}`).join(", "));
console.log("\nBase de datos de prueba lista.");
