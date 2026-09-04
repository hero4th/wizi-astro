export const prerender = false;

import type { APIRoute } from "astro";
import {
  requireSession,
  verifyPassword,
  validatePasswordStrength,
  changePassword,
  createSessionToken,
  setSessionCookie,
  isActionRateLimited,
  recordActionAttempt,
  clientIp,
} from "@/lib/auth";

const ACTION = "password-change";
const noStore = { "Cache-Control": "no-store", "Content-Type": "application/json" };

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: noStore });

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!(await requireSession(cookies))) {
    return json({ error: "No autorizado." }, 401);
  }

  const ip = clientIp(request);
  if (await isActionRateLimited(ip, ACTION)) {
    return json(
      { error: "Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo." },
      429
    );
  }

  const data = await request.json().catch(() => ({}));
  const currentPassword = String(data.currentPassword ?? "");
  const newPassword = String(data.newPassword ?? "");

  // Re-authenticate: holding a session is not enough to change the password,
  // so a hijacked session alone can't lock the owner out of their own panel.
  const currentOk = currentPassword.length > 0 && (await verifyPassword(currentPassword));
  if (!currentOk) {
    await recordActionAttempt(ip, ACTION, false);
    return json({ error: "La contraseña actual no es correcta." }, 403);
  }

  const policyError = validatePasswordStrength(newPassword);
  if (policyError) {
    await recordActionAttempt(ip, ACTION, false);
    return json({ error: policyError }, 422);
  }

  if (newPassword === currentPassword) {
    await recordActionAttempt(ip, ACTION, false);
    return json({ error: "La nueva contraseña debe ser distinta de la actual." }, 422);
  }

  // Changing the password bumps sessions_valid_from, which invalidates every
  // session — including this one — so a fresh cookie is issued right after to
  // keep the admin signed in where they are.
  await changePassword(newPassword);
  setSessionCookie(cookies, await createSessionToken());
  await recordActionAttempt(ip, ACTION, true);

  return json(
    { ok: true, message: "Contraseña actualizada. Las demás sesiones se cerraron." },
    200
  );
};
