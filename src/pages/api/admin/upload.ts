export const prerender = false;

import type { APIRoute } from "astro";
import { put } from "@vercel/blob";
import { requireSession } from "@/lib/auth";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export const POST: APIRoute = async ({ request, cookies }) => {
  // See posts.ts for why there's no separate Origin check here.
  if (!(await requireSession(cookies))) return new Response("Unauthorized", { status: 401 });

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) return new Response("No file provided.", { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return new Response(`Tipo de archivo no permitido: ${file.type}`, { status: 415 });
  if (file.size > MAX_BYTES) return new Response("La imagen supera el límite de 8 MB.", { status: 413 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const safeName = `${crypto.randomUUID()}.${ext}`;

  try {
    const blob = await put(`blog/${safeName}`, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });
    return new Response(JSON.stringify({ url: blob.url }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", (err as Error).message);
    return new Response("Error al subir la imagen.", { status: 500 });
  }
};
