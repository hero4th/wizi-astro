export const prerender = false;

import type { APIRoute } from "astro";
import {
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  isRateLimited,
  recordLoginAttempt,
  clientIp,
} from "@/lib/auth";

const noStore = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const ip = clientIp(request);

  if (await isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." }),
      { status: 429, headers: noStore }
    );
  }

  const data = await request.json().catch(() => ({}));
  const password = String(data.password ?? "");

  let ok = false;
  try {
    ok = password.length > 0 && (await verifyPassword(password));
  } catch (err) {
    console.error("Login error:", (err as Error).message);
    return new Response(JSON.stringify({ error: "Error de configuración del servidor." }), {
      status: 500,
      headers: noStore,
    });
  }

  await recordLoginAttempt(ip, ok);

  // A failed login answers with 401, not a redirect: the client needs to tell
  // failure apart from success, and both used to come back as a 303.
  if (!ok) {
    return new Response(JSON.stringify({ error: "Contraseña incorrecta." }), {
      status: 401,
      headers: noStore,
    });
  }

  setSessionCookie(cookies, await createSessionToken());
  return redirect("/admin", 303);
};
