export const prerender = false;

import type { APIRoute } from "astro";
import { requireSession, invalidateAllSessions, clearSessionCookie } from "@/lib/auth";

const noStore = { "Cache-Control": "no-store", "Content-Type": "application/json" };

/** Sign out everywhere: invalidates every session, this one included. */
export const DELETE: APIRoute = async ({ cookies }) => {
  if (!(await requireSession(cookies))) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 401,
      headers: noStore,
    });
  }

  await invalidateAllSessions();
  clearSessionCookie(cookies);

  return new Response(
    JSON.stringify({ ok: true, message: "Se cerraron todas las sesiones." }),
    { status: 200, headers: noStore }
  );
};
