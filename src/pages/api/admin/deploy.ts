export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession } from "@/lib/auth";

export const POST: APIRoute = async ({ cookies }) => {
  if (!(await requireSession(cookies))) {
    return new Response("Unauthorized", { status: 401 });
  }

  const hookUrl = process.env.NETLIFY_BUILD_HOOK_URL || process.env.BUILD_HOOK_URL;

  if (!hookUrl) {
    return new Response(
      JSON.stringify({
        error: "Falta configurar NETLIFY_BUILD_HOOK_URL en las variables de entorno de Netlify.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const res = await fetch(hookUrl, { method: "POST" });
    if (!res.ok) {
      const text = await res.text();
      console.error("[admin/deploy] Build hook error:", res.status, text);
      return new Response(
        JSON.stringify({ error: "No se pudo disparar el deploy. Revisa el Build Hook." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Deploy iniciado correctamente. Netlify comenzará a construir el sitio en unos segundos.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[admin/deploy] Error:", err?.message || err);
    return new Response(
      JSON.stringify({ error: "Error al conectar con Netlify." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
