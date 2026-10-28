export const prerender = false;

import type { APIRoute } from "astro";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { sql } from "@/lib/db";
import { processContentHtml } from "@/lib/content";

const headers = { "Cache-Control": "no-store", "Content-Type": "application/json" };
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

export const GET: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(user, PERMISSIONS.SNIPPETS_READ)) return json({ error: "Sin permiso." }, 403);

  const rows = await sql`SELECT id, name, html FROM snippets ORDER BY created_at DESC LIMIT 100`;
  return json({ snippets: rows });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(user, PERMISSIONS.SNIPPETS_CREATE)) return json({ error: "Sin permiso." }, 403);

  const data = await request.json().catch(() => ({}));
  const name = String(data.name ?? "").trim().slice(0, 80);
  const rawHtml = String(data.html ?? "");

  if (!name) return json({ error: "Ponle un nombre al bloque." }, 422);
  if (!rawHtml.trim()) return json({ error: "El bloque está vacío." }, 422);

  // Snippets get inserted straight back into posts, so they go through the same
  // sanitizer as post bodies rather than being trusted as stored.
  const html = processContentHtml(rawHtml);
  const rows = await sql`
    INSERT INTO snippets (name, html) VALUES (${name}, ${html})
    RETURNING id, name, html
  `;
  return json({ snippet: rows[0] }, 201);
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) return json({ error: "No autorizado." }, 401);
  if (!hasPermission(user, PERMISSIONS.SNIPPETS_DELETE)) return json({ error: "Sin permiso." }, 403);

  const data = await request.json().catch(() => ({}));
  const id = Number(data.id);
  if (!Number.isInteger(id)) return json({ error: "Id inválido." }, 422);
  await sql`DELETE FROM snippets WHERE id = ${id}`;
  return json({ ok: true });
};
