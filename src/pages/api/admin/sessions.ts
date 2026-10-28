export const prerender = false;

import type { APIRoute } from "astro";
import { getSessionUser, invalidateUserSessions, clearSessionCookie } from "@/lib/auth";

const noStore = { "Cache-Control": "no-store", "Content-Type": "application/json" };

/** Sign out everywhere for the current account. */
export const DELETE: APIRoute = async ({ cookies }) => {
  const user = await getSessionUser(cookies);
  if (!user) {
    return new Response(JSON.stringify({ error: "No autorizado." }), {
      status: 401,
      headers: noStore,
    });
  }

  await invalidateUserSessions(user.id);
  clearSessionCookie(cookies);

  return new Response(
    JSON.stringify({ ok: true, message: "Se cerraron todas tus sesiones." }),
    { status: 200, headers: noStore }
  );
};
