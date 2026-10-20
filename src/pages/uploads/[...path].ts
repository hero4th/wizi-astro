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
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
