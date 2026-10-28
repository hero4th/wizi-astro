export const prerender = false;

import type { APIRoute } from "astro";
import {
  verifyUserPassword,
  createSessionToken,
  setSessionCookie,
  isRateLimited,
  recordLoginAttempt,
  touchLastLogin,
  clientIp,
} from "@/lib/auth";

const noStore = { "Cache-Control": "no-store", "Content-Type": "application/json" };

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const ip = clientIp(request);

  const data = await request.json().catch(() => ({}));
  const email = String(data.email ?? "").trim();
  const password = String(data.password ?? "");

  if (await isRateLimited(ip, email)) {
    return new Response(
      JSON.stringify({ error: "Demasiados intentos. Espera 15 minutos e intenta de nuevo." }),
      { status: 429, headers: noStore }
    );
  }

  if (!email || !password) {
    await recordLoginAttempt(ip, email, false);
    return new Response(JSON.stringify({ error: "Correo y contraseña son obligatorios." }), {
      status: 400,
      headers: noStore,
    });
  }

  let account = null;
  try {
    account = await verifyUserPassword(email, password);
  } catch (err) {
    console.error("Login error:", (err as Error).message);
    return new Response(JSON.stringify({ error: "Error de configuración del servidor." }), {
      status: 500,
      headers: noStore,
    });
  }

  await recordLoginAttempt(ip, email, Boolean(account));

  if (!account) {
    // Same answer for unknown email, wrong password, or inactive account.
    return new Response(JSON.stringify({ error: "Correo o contraseña incorrectos." }), {
      status: 401,
      headers: noStore,
    });
  }

  await touchLastLogin(account.id);
  setSessionCookie(cookies, await createSessionToken(account.id));
  return redirect("/admin", 303);
};
