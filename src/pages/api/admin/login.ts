export const prerender = false;

import type { APIRoute } from "astro";
import { verifyPassword, createSessionToken, setSessionCookie, isRateLimited, recordLoginAttempt } from "@/lib/auth";

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const ip = clientIp(request);

  if (await isRateLimited(ip)) {
    return new Response("Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.", { status: 429 });
  }

  const data = await request.json().catch(() => ({}));
  const password = String(data.password ?? "");

  const ok = password.length > 0 && (await verifyPassword(password));
  await recordLoginAttempt(ip, ok);

  if (!ok) {
    return redirect("/admin/login?error=1", 303);
  }

  const token = await createSessionToken();
  setSessionCookie(cookies, token);
  return redirect("/admin", 303);
};
