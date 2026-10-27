export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession } from "@/lib/auth";
import { generateBlogSnapshot } from "@/lib/blog-snapshot";

export const POST: APIRoute = async ({ cookies }) => {
  if (!(await requireSession(cookies))) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const posts = await generateBlogSnapshot();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: posts.length,
        message: "Snapshot generado localmente. Para publicar los cambios en producción ejecuta un deploy manual en Netlify."
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } 
      }
    );
  } catch (err) {
    console.error("[admin/blog/snapshot] Error:", err);
    return new Response(
      JSON.stringify({ error: "Error al generar snapshot" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
