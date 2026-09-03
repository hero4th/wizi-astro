export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { processContentHtml, readingTimeFromHtml } from "@/lib/content";
import { slugify } from "@/lib/slug";

export const POST: APIRoute = async ({ request, cookies }) => {
  // CSRF protection is the session cookie itself (httpOnly, secure,
  // sameSite=strict — never sent on a cross-site request in the first
  // place, which is the current recommended baseline). A manual Origin
  // comparison was tried here too, but request.url doesn't reliably reflect
  // the public origin behind Vercel's proxy, so it rejected legitimate
  // requests in production while never having caught anything sameSite
  // wasn't already blocking.
  if (!(await requireSession(cookies))) return new Response("Unauthorized", { status: 401 });

  const data = await request.json();
  const title: string = String(data.title ?? "").trim();
  const rawBody: string = String(data.body ?? "");
  if (!title || !rawBody || rawBody === "<p></p>") {
    return new Response("Título y contenido son obligatorios.", { status: 400 });
  }

  let slug: string = data.slug?.trim() ? slugify(data.slug) : slugify(title);
  if (!slug) return new Response("No se pudo generar un slug válido.", { status: 400 });

  const html = processContentHtml(rawBody);
  const readingTime = data.readingTime ? Number(data.readingTime) : readingTimeFromHtml(html);
  const categories = Array.isArray(data.categories) ? data.categories : [];

  try {
    const rows = await sql`
      INSERT INTO posts (
        slug, title, description, category, category_slug, categories,
        pub_date, updated_date, image, image_alt, image_width, image_height,
        author, reading_time, draft, body, html
      ) VALUES (
        ${slug}, ${title}, ${data.description ?? ""}, ${data.category ?? "General"}, ${data.categorySlug ?? "general"},
        ${JSON.stringify(categories)}, ${data.pubDate ?? new Date().toISOString().slice(0, 10)}, ${data.updatedDate ?? null},
        ${data.image ?? null}, ${data.imageAlt ?? ""}, ${data.imageWidth ?? null}, ${data.imageHeight ?? null},
        ${data.author ?? "Professional Academy"}, ${readingTime}, ${data.draft ?? true}, ${html}, ${html}
      )
      RETURNING id, slug
    `;
    return new Response(JSON.stringify(rows[0]), { status: 201, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    const message = (err as Error).message;
    if (message.includes("posts_slug_key")) {
      return new Response("Ya existe un post con ese slug.", { status: 409 });
    }
    console.error("Error creating post:", message);
    return new Response("Error al crear el post.", { status: 500 });
  }
};
