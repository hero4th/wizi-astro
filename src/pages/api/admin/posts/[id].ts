export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { processContentHtml, readingTimeFromHtml } from "@/lib/content";
import { stripFeaturedImageDuplicates } from "@/lib/blog-images";
import { slugify } from "@/lib/slug";
import { seoFields } from "@/lib/post-meta";

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  // See posts.ts for why there's no separate Origin check: the session
  // cookie's sameSite=strict already rules out cross-site requests, and a
  // manual Origin comparison here rejected legitimate requests in
  // production (request.url doesn't reliably reflect the public origin
  // behind Vercel's proxy).
  if (!(await requireSession(cookies))) return new Response("Unauthorized", { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return new Response("Invalid id", { status: 400 });

  const data = await request.json();
  const title: string = String(data.title ?? "").trim();
  const rawBody: string = String(data.body ?? "");
  if (!title || !rawBody || rawBody === "<p></p>") {
    return new Response("Título y contenido son obligatorios.", { status: 400 });
  }

  const slug: string = data.slug?.trim() ? slugify(data.slug) : slugify(title);
  const html = stripFeaturedImageDuplicates(processContentHtml(rawBody), data.image);
  const readingTime = data.readingTime ? Number(data.readingTime) : readingTimeFromHtml(html);
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const seo = seoFields(data);

  try {
    const rows = await sql`
      UPDATE posts SET
        slug = ${slug},
        title = ${title},
        description = ${data.description ?? ""},
        category = ${data.category ?? "General"},
        category_slug = ${data.categorySlug ?? "general"},
        categories = ${JSON.stringify(categories)},
        pub_date = ${data.pubDate ?? new Date().toISOString().slice(0, 10)},
        updated_date = ${data.updatedDate ?? null},
        image = ${data.image ?? null},
        image_alt = ${data.imageAlt ?? ""},
        image_width = ${data.imageWidth ?? null},
        image_height = ${data.imageHeight ?? null},
        author = ${data.author ?? "Professional Academy"},
        reading_time = ${readingTime},
        draft = ${data.draft ?? true},
        body = ${html},
        html = ${html},
        seo_title = ${seo.seoTitle},
        seo_description = ${seo.seoDescription},
        canonical_url = ${seo.canonicalUrl},
        noindex = ${seo.noindex},
        og_image = ${seo.ogImage},
        keywords = ${seo.keywords},
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, slug
    `;
    if (rows.length === 0) return new Response("Post no encontrado.", { status: 404 });
    return new Response(JSON.stringify(rows[0]), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("posts_slug_key")) {
      return new Response("Ya existe un post con ese slug.", { status: 409 });
    }
    console.error("Error updating post:", message);
    return new Response("Error al guardar el post.", { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params, cookies }) => {
  if (!(await requireSession(cookies))) return new Response("Unauthorized", { status: 401 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return new Response("Invalid id", { status: 400 });

  await sql`DELETE FROM posts WHERE id = ${id}`;
  return new Response(null, { status: 204 });
};
