export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession } from "@/lib/auth";
import { generateBlogSnapshot, triggerNetlifyBuild } from "@/lib/blog-snapshot";

export const POST: APIRoute = async ({ cookies }) => {
  if (!(await requireSession(cookies))) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const posts = await generateBlogSnapshot();
    const triggered = await triggerNetlifyBuild();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        count: posts.length,
        buildTriggered: triggered 
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
