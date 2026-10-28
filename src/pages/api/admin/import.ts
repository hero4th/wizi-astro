export const prerender = false;

import type { APIRoute } from "astro";
import { getSessionUser, hasPermission, clientIp, isActionRateLimited, recordActionAttempt } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { sql } from "@/lib/db";
import { processContentHtml, readingTimeFromHtml } from "@/lib/content";
import { stripFeaturedImageDuplicates } from "@/lib/blog-images";
import { slugify } from "@/lib/slug";
import { seoFields } from "@/lib/post-meta";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

interface ImportPost {
  slug?: string;
  title?: string;
  description?: string;
  category?: string;
  category_slug?: string;
  categories?: unknown;
  pub_date?: string;
  updated_date?: string | null;
  image?: string | null;
  image_alt?: string | null;
  image_width?: number | null;
  image_height?: number | null;
  author?: string | null;
  reading_time?: number | null;
  draft?: boolean;
  body?: string;
  html?: string;
  seo_title?: string | null;
  seo_description?: string | null;
  canonical_url?: string | null;
  noindex?: boolean;
  og_image?: string | null;
  keywords?: string | null;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(user, PERMISSIONS.BACKUP_IMPORT)) return json({ error: "Sin permiso." }, 403);

  const ip = clientIp(request);
  if (await isActionRateLimited(ip, "data-import")) {
    return json({ error: "Demasiados intentos de importación. Intenta más tarde." }, 429);
  }

  let payload: { version?: number; posts?: ImportPost[]; snippets?: { name?: string; html?: string }[] };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "JSON inválido." }, 400);
  }

  if (payload.version !== 1) return json({ error: "Versión de backup no soportada." }, 400);
  if (!Array.isArray(payload.posts)) return json({ error: "El backup no contiene posts." }, 400);

  let postsImported = 0;
  let postsSkipped = 0;
  let snippetsImported = 0;

  try {
    // --- Upsert posts ---
    for (const raw of payload.posts) {
      const title = String(raw.title ?? "").trim();
      const rawBody = String(raw.body ?? raw.html ?? "");
      if (!title || !rawBody) { postsSkipped++; continue; }

      const slug = raw.slug?.trim() ? slugify(raw.slug) : slugify(title);
      if (!slug) { postsSkipped++; continue; }

      const html = stripFeaturedImageDuplicates(processContentHtml(rawBody), raw.image);
      const readingTime = raw.reading_time || readingTimeFromHtml(html);
      const categories = Array.isArray(raw.categories) ? raw.categories : [];
      const cat = Array.isArray(categories) && categories.length > 0 ? categories[0] : null;

      // Normalize SEO fields from the raw DB row shape.
      const seo = seoFields({
        seoTitle: raw.seo_title,
        seoDescription: raw.seo_description,
        canonicalUrl: raw.canonical_url,
        noindex: raw.noindex === true,
        ogImage: raw.og_image,
        keywords: raw.keywords,
      });

      await sql`
        INSERT INTO posts (
          slug, title, description, category, category_slug, categories,
          pub_date, updated_date, image, image_alt, image_width, image_height,
          author, reading_time, draft, body, html,
          seo_title, seo_description, canonical_url, noindex, og_image, keywords,
          created_by_user_id, updated_by_user_id
        ) VALUES (
          ${slug}, ${title}, ${String(raw.description ?? "")}, ${String(raw.category ?? cat?.name ?? "General")},
          ${String(raw.category_slug ?? cat?.slug ?? "general")},
          ${JSON.stringify(categories)}, ${raw.pub_date ?? new Date().toISOString().slice(0, 10)},
          ${raw.updated_date ?? null},
          ${raw.image ?? null}, ${String(raw.image_alt ?? "")}, ${raw.image_width ?? null}, ${raw.image_height ?? null},
          ${String(raw.author ?? "Professional Academy")}, ${readingTime}, ${raw.draft === false ? false : true},
          ${html}, ${html},
          ${seo.seoTitle}, ${seo.seoDescription}, ${seo.canonicalUrl}, ${seo.noindex}, ${seo.ogImage}, ${seo.keywords},
          ${user.id}, ${user.id}
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
          seo_title = EXCLUDED.seo_title,
          seo_description = EXCLUDED.seo_description,
          canonical_url = EXCLUDED.canonical_url,
          noindex = EXCLUDED.noindex,
          og_image = EXCLUDED.og_image,
          keywords = EXCLUDED.keywords,
          updated_by_user_id = EXCLUDED.updated_by_user_id,
          updated_at = now()
      `;
      postsImported++;
    }

    // --- Upsert snippets ---
    if (Array.isArray(payload.snippets)) {
      for (const raw of payload.snippets) {
        const name = String(raw.name ?? "").trim().slice(0, 80);
        const rawHtml = String(raw.html ?? "");
        if (!name || !rawHtml.trim()) continue;
        const html = processContentHtml(rawHtml);
        await sql`
          INSERT INTO snippets (name, html) VALUES (${name}, ${html})
          ON CONFLICT DO NOTHING
        `;
        snippetsImported++;
      }
    }

    await recordActionAttempt(ip, "data-import", true, user.id);

    return json({ posts: postsImported, postsSkipped, snippets: snippetsImported });
  } catch (err) {
    console.error("Import error:", (err as Error).message);
    return json({ error: "Error al importar los datos." }, 500);
  }
};
