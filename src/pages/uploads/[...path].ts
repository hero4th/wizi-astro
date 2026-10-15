export const prerender = false;

import type { APIRoute } from "astro";
import { contentTypeFor, readUpload, resolveUpload } from "@/lib/storage";

// Serves locally-stored admin uploads (replaces the former Vercel Blob CDN URLs).
export const GET: APIRoute = async ({ params }) => {
  const segments = (params.path ?? "").split("/").filter(Boolean);
  const fullPath = resolveUpload(segments);
  if (!fullPath) return new Response("Not found", { status: 404 });

  const file = await readUpload(fullPath);
  return new Response(new Uint8Array(file), {
    status: 200,
    headers: {
      "Content-Type": contentTypeFor(fullPath),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
