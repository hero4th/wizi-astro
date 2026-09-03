export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession } from "@/lib/auth";
import { sql } from "@/lib/db";
import { processContentHtml, readingTimeFromHtml } from "@/lib/content";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
}

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export const PUT: APIRoute = async ({ params, request, cookies }) => {
  if (!(await requireSession(cookies))) return new Response("Unauthorized", { status: 401 });
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return new Response("Invalid id", { status: 400 });

  const data = await request.json();
  const title: string = String(data.title ?? "").trim();
  const rawBody: string = String(data.body ?? "");
  if (!title || !rawBody || rawBody === "<p></p>") {
    return new Response("Título y contenido son obligatorios.", { status: 400 });
  }

  const slug: string = data.slug?.trim() ? slugify(data.slug) : slugify(title);
  const html = processContentHtml(rawBody);
  const readingTime = data.readingTime ? Number(data.readingTime) : readingTimeFromHtml(html);
  const categories = Array.isArray(data.categories) ? data.categories : [];

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

export const DELETE: APIRoute = async ({ params, request, cookies }) => {
  if (!(await requireSession(cookies))) return new Response("Unauthorized", { status: 401 });
  if (!isSameOrigin(request)) return new Response("Forbidden", { status: 403 });

  const id = Number(params.id);
  if (!Number.isInteger(id)) return new Response("Invalid id", { status: 400 });

  await sql`DELETE FROM posts WHERE id = ${id}`;
  return new Response(null, { status: 204 });
};
