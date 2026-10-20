export const prerender = false;

import type { APIRoute } from "astro";
import JSZip from "jszip";
import { requireSession, clientIp, isActionRateLimited, recordActionAttempt } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getUpload } from "@/lib/storage";

// SELECT-only endpoint — safe to run against a read-only database (Neon prod).
const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

const SCHEMA_SQL = `-- Esquema ProAcademy (referencia)
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]',
  pub_date DATE NOT NULL,
  updated_date DATE,
  image TEXT,
  image_alt TEXT NOT NULL DEFAULT '',
  image_width INT,
  image_height INT,
  author TEXT NOT NULL DEFAULT 'Professional Academy',
  reading_time INT NOT NULL DEFAULT 5,
  draft BOOLEAN NOT NULL DEFAULT true,
  body TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  noindex BOOLEAN NOT NULL DEFAULT false,
  og_image TEXT,
  keywords TEXT
);

CREATE TABLE IF NOT EXISTS snippets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_credentials (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  password_hash TEXT NOT NULL,
  sessions_valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_action_attempts (
  id SERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  action TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const EXT_MIME: Record<string, string> = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp",
  "image/gif": ".gif", "image/svg+xml": ".svg",
};

function safeKey(url: string): string {
  // Derive a filesystem-safe key from any image URL.
  try {
    const u = new URL(url, "http://x");
    const base = u.pathname.split("/").filter(Boolean).pop() ?? "image";
    return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "image";
  } catch {
    return "image";
  }
}

/** Collect every unique image URL referenced in a post (cover + body). */
function collectImageUrls(post: Record<string, unknown>): string[] {
  const urls = new Set<string>();
  if (post.image) urls.add(post.image as string);
  const html = String(post.html ?? "");
  for (const m of html.matchAll(/<img[^>]+src\s*=\s*"([^"]+)"/gi)) {
    const src = m[1];
    if (src && (src.startsWith("http") || src.startsWith("/"))) urls.add(src);
  }
  return [...urls];
}

async function downloadImage(url: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  // Blobs-backed uploads (/uploads/...)
  if (url.startsWith("/uploads/")) {
    const segments = url.slice("/uploads/".length).split("/").filter(Boolean);
    return getUpload(segments);
  }

  // Local static assets (/images/...) — fetch from the deployed site origin.
  if (url.startsWith("/images/")) {
    const origin = process.env.DEPLOY_PRIME_URL ?? process.env.URL ?? "http://localhost:4321";
    try {
      const res = await fetch(`${origin}${url}`, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (res.ok) return { data: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "application/octet-stream" };
    } catch { /* fall through */ }
    return null;
  }

  // External URLs (WordPress, etc.) — download with a browser UA.
  if (url.startsWith("http")) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ProAcademyBackup/1.0)" } });
      if (res.ok) {
        const contentType = res.headers.get("content-type") ?? "application/octet-stream";
        if (contentType.startsWith("image/")) return { data: await res.arrayBuffer(), contentType };
      }
    } catch { /* fall through */ }
  }

  return null;
}

export const GET: APIRoute = async ({ cookies, request }) => {
  if (!(await requireSession(cookies))) return json({ error: "No autorizado." }, 401);

  const ip = clientIp(request);
  if (await isActionRateLimited(ip, "data-export")) {
    return json({ error: "Demasiadas exportaciones. Intenta más tarde." }, 429);
  }

  try {
    // --- Read data (SELECT only — never writes) ---
    const posts = await sql`SELECT * FROM posts ORDER BY id`;
    const snippets = await sql`SELECT id, name, html FROM snippets ORDER BY id`;

    // --- Collect unique image URLs ---
    const allUrls = new Set<string>();
    for (const post of posts) for (const url of collectImageUrls(post)) allUrls.add(url);

    // --- Download images in parallel ---
    const zip = new JSZip();
    const imagesFolder = zip.folder("images")!;
    const imageMap: Record<string, string> = {}; // originalUrl -> zipPath
    let downloaded = 0;
    let failed = 0;

    // Download in small batches: firing all requests at once saturates the
    // remote host (WordPress rate-limits / resets concurrent connections) and
    // most downloads silently fail. Bounded parallelism + one retry per URL
    // keeps the host happy while still finishing well inside the function
    // timeout.
    const CONCURRENCY = 6;
    const urls = [...allUrls];

    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const batch = urls.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (url) => {
          let file = await downloadImage(url);
          if (!file) {
            // One retry after a short pause — transient resets are common
            // when several requests hit the same host back to back.
            await new Promise((r) => setTimeout(r, 600));
            file = await downloadImage(url);
          }
          if (!file) { failed++; return; }

          // Ensure unique key inside the ZIP.
          let key = safeKey(url);
          const ext = Object.entries(EXT_MIME).find(([, e]) => file.contentType.includes(e.split("/")[1]))?.[1] ?? "";
          if (ext && !key.endsWith(ext)) key += ext;
          let uniqueKey = key;
          let n = 2;
          while (imageMap[url] !== undefined || Object.values(imageMap).includes(uniqueKey)) {
            uniqueKey = `${n++}-${key}`;
          }

          imagesFolder.file(uniqueKey, file.data);
          imageMap[url] = `images/${uniqueKey}`;
          downloaded++;
        })
      );
    }

    // --- Build data.json ---
    const dataJson = {
      version: 1,
      exportedAt: new Date().toISOString(),
      site: process.env.URL ?? null,
      counts: { posts: posts.length, snippets: snippets.length, images: downloaded },
      posts,
      snippets,
      imageMap,
    };
    zip.file("data.json", JSON.stringify(dataJson));
    zip.file("schema.sql", SCHEMA_SQL);

    // --- Store ZIP in Blobs ---
    const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const key = `exports/backup-${timestamp}.zip`;

    const { getStore } = await import("@netlify/blobs");
    const store = getStore({ name: "uploads", consistency: "strong" });
    await store.set(key, buffer);

    await recordActionAttempt(ip, "data-export", true);

    return json({
      url: `/uploads/${key}`,
      size: buffer.byteLength,
      counts: { posts: posts.length, snippets: snippets.length, images: downloaded, imagesFailed: failed },
    });
  } catch (err) {
    console.error("Export error:", (err as Error).message);
    return json({ error: "Error al generar el backup." }, 500);
  }
};
