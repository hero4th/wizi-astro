export const prerender = false;

import type { APIRoute } from "astro";
import { getSessionUser, hasPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { generateBlogSnapshot } from "@/lib/blog-snapshot";

export const POST: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!hasPermission(user, PERMISSIONS.POSTS_PUBLISH)) {
    return new Response(JSON.stringify({ error: "No tienes permiso para generar el snapshot." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
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
