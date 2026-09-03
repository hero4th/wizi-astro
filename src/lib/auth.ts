/**
 * Admin-panel authentication: single-credential login (this is a one-editor
 * admin panel, not a multi-user system) backed by a bcrypt password hash and
 * signed, httpOnly session cookies — plus basic DB-backed rate limiting on
 * login attempts.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { AstroCookies } from "astro";
import { sql } from "./db";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return new TextEncoder().encode(secret);
}

export async function verifyPassword(plaintext: string): Promise<boolean> {
  const hash = import.meta.env.ADMIN_PASSWORD_HASH;
  if (!hash) throw new Error("ADMIN_PASSWORD_HASH is not configured.");
  return bcrypt.compare(plaintext, hash);
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export function setSessionCookie(cookies: AstroCookies, token: string) {
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(cookies: AstroCookies) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
}

export async function requireSession(cookies: AstroCookies): Promise<boolean> {
  return isValidSession(cookies.get(SESSION_COOKIE)?.value);
}

// ---------------------------------------------------------------------------
// Login rate limiting — max 5 failed attempts per IP in a 15-minute window.
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function isRateLimited(ip: string): Promise<boolean> {
  const rows = await sql`
    SELECT count(*)::int AS n FROM login_attempts
    WHERE ip = ${ip}
      AND success = false
      AND attempted_at > now() - make_interval(mins => ${WINDOW_MINUTES})
  `;
  return (rows[0]?.n ?? 0) >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  await sql`INSERT INTO login_attempts (ip, success) VALUES (${ip}, ${success})`;
}
