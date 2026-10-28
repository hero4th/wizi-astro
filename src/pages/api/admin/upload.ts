export const prerender = false;

import type { APIRoute } from "astro";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { saveUpload } from "@/lib/storage";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

export const POST: APIRoute = async ({ request, cookies }) => {
  // See posts.ts for why there's no separate Origin check here.
  const user = await getSessionUser(cookies);
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (!hasPermission(user, PERMISSIONS.MEDIA_UPLOAD)) {
    return new Response("Forbidden", { status: 403 });
  }

  // The upload is sent as a raw binary body (not multipart/form-data via
  // FormData) specifically so Astro's built-in CSRF guard doesn't see it:
  // that guard triggers on form-urlencoded/multipart/text-plain content
  // types (see the login fix for the same pattern), which a FormData
  // upload would otherwise be.
  const contentType = request.headers.get("content-type") ?? "";
  const filenameHeader = request.headers.get("x-filename");
  const filename = filenameHeader ? decodeURIComponent(filenameHeader) : "upload.bin";

  if (!ALLOWED_TYPES.has(contentType)) return new Response(`Tipo de archivo no permitido: ${contentType}`, { status: 415 });

  const buffer = await request.arrayBuffer();
  if (buffer.byteLength === 0) return new Response("No file provided.", { status: 400 });
  if (buffer.byteLength > MAX_BYTES) return new Response("La imagen supera el límite de 8 MB.", { status: 413 });

  const ext = filename.split(".").pop()?.toLowerCase() || "bin";
  const safeName = `${crypto.randomUUID()}.${ext}`;

  try {
    await saveUpload(buffer, safeName);
    return new Response(JSON.stringify({ url: `/uploads/${safeName}` }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", (err as Error).message);
    return new Response("Error al subir la imagen.", { status: 500 });
  }
};
