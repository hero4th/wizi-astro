/**
 * Adds the reusable-snippets table and the per-post SEO metadata columns.
 * Safe to re-run.
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

function readEnv(name) {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${name}=(.+)$`, "m"));
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
  return undefined;
}

const sql = neon(readEnv("DATABASE_URL"));

await sql`
  CREATE TABLE IF NOT EXISTS snippets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    html TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("✓ snippets");

// Hidden/SEO metadata that isn't part of the visible article body.
const columns = [
  ["seo_title", "TEXT"],
  ["seo_description", "TEXT"],
  ["canonical_url", "TEXT"],
  ["noindex", "BOOLEAN NOT NULL DEFAULT false"],
  ["og_image", "TEXT"],
  ["keywords", "TEXT"],
];

for (const [name, type] of columns) {
  await sql.query(`ALTER TABLE posts ADD COLUMN IF NOT EXISTS ${name} ${type}`);
  console.log(`✓ posts.${name}`);
}

const cols = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'posts' AND column_name = ANY(${columns.map((c) => c[0])})
  ORDER BY column_name
`;
console.log("columnas confirmadas:", cols.map((c) => c.column_name).join(", "));
