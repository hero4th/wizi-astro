// Build-time helper: published blog post URLs for the sitemap's `customPages`,
// since /blog/[slug] is now SSR (posts live in Postgres, not static content
// files) and Astro can no longer discover them by scanning prerendered routes.
import { neon } from "@neondatabase/serverless";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function loadLocalEnv() {
  const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  for (const name of [".env.local", ".env"]) {
    const file = path.join(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf-8").split("\n")) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
}

export async function getBlogSitemapUrls(siteUrl) {
  if (!process.env.DATABASE_URL) loadLocalEnv();
  if (!process.env.DATABASE_URL) return [];

  try {
    const sql = neon(process.env.DATABASE_URL);
    const rows = await sql`SELECT slug FROM posts WHERE draft = false`;
    return rows.map((r) => `${siteUrl}/blog/${r.slug}`);
  } catch (err) {
    console.warn(`[sitemap] Could not fetch blog post URLs: ${err.message}`);
    return [];
  }
}
