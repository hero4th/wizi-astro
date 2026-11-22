export const prerender = false;

import type { APIRoute } from "astro";
import { getUpload } from "@/lib/storage";

// Serves admin uploads stored in Netlify Blobs.
export const GET: APIRoute = async ({ params }) => {
  const segments = (params.path ?? "").split("/").filter(Boolean);
  const file = await getUpload(segments);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(file.data, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      // Uploads are stored under a random UUID and never overwritten, so they
      // can be cached forever. `Netlify-CDN-Cache-Control` is what makes
      // Netlify's edge cache the function response: without it every image
      // request invoked this function and read from Netlify Blobs.
      "Cache-Control": "public, max-age=31536000, immutable",
      "Netlify-CDN-Cache-Control": "public, durable, max-age=31536000, immutable",
    },
  });
};
