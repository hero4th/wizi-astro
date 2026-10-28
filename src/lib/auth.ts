/**
 * Admin-panel authentication and authorization.
 *
 * The panel is multi-user: every account lives in `admin_users` and gets its
 * capabilities from the role assigned in `roles` / `role_permissions`. Roles
 * are data, not code, so adding a new role (or changing what an existing one
 * can do) does not require a deploy.
 *
 * Sessions are signed, httpOnly cookies with the user id in `sub`. The role and
 * permissions are loaded from the database on every request, so revoking a
 * permission or deactivating an account takes effect immediately instead of
 * waiting for the cookie to expire.
 */
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { AstroCookies } from "astro";
import { sql } from "./db";

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours
const BCRYPT_ROUNDS = 12;

/** bcrypt silently truncates anything past 72 bytes, so passwords are capped
 *  there rather than giving a false sense of extra strength. */
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_MIN_LENGTH = 12;

export interface AdminRole {
  id: number;
  slug: string;
  name: string;
  priority: number;
}

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole;
  permissions: string[];
  passwordChangedAt: Date;
  /** Internal: used to validate the session's issued-at claim. */
  sessionsValidFrom: Date;
}

export interface AuthenticatedAccount {
  id: number;
  email: string;
  name: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET ?? import.meta.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return new TextEncoder().encode(secret);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hasPermission(user: SessionUser | null, permission: string): boolean {
  return Boolean(user?.permissions.includes(permission));
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

/**
 * A bcrypt hash of a value nobody knows, compared against when there is no
 * stored hash, so a misconfigured install still takes the same amount of time
 * to reject a login as a real wrong-password check would.
 */
const DUMMY_HASH = "$2b$12$Il7TLDDjtZM205FScgtMfeCywLGmxlBXbOUBD6fGFqtH8A9xY8sHK";

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

/**
 * Validate credentials for login. Returns the account on success, or null for
 * an unknown email, a wrong password, or a deactivated account. All three
 * cases intentionally look identical to the caller.
 */
export async function verifyUserPassword(
  email: string,
  plaintext: string
): Promise<AuthenticatedAccount | null> {
  const normalized = normalizeEmail(email);
  const rows = await sql`
    SELECT id, email, name, password_hash, active
    FROM admin_users
    WHERE lower(email) = lower(${normalized})
    LIMIT 1
  `;
  const row = rows[0];

  if (!row) {
    await bcrypt.compare(plaintext, DUMMY_HASH);
    return null;
  }

  const passwordOk = await bcrypt.compare(plaintext, row.password_hash as string);
  if (!passwordOk || !row.active) return null;

  return {
    id: row.id as number,
    email: row.email as string,
    name: row.name as string,
  };
}

/**
 * Returns an error message, or null when the password is acceptable.
 * Length is the dominant factor; character-class variety is required loosely
 * (3 of 4) rather than rigidly, which is what current NIST guidance favours.
 */
export function validatePasswordStrength(password: string): string | null {
  const bytes = new TextEncoder().encode(password).length;

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (bytes > PASSWORD_MAX_BYTES) {
    return `La contraseña es demasiado larga (máximo ${PASSWORD_MAX_BYTES} bytes).`;
  }
  if (/^\s|\s$/.test(password)) {
    return "La contraseña no puede empezar ni terminar con espacios.";
  }

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) =>
    re.test(password)
  ).length;
  if (classes < 3) {
    return "Usa al menos 3 de estos 4: minúsculas, mayúsculas, números y símbolos.";
  }

  if (/^(.)\1+$/.test(password)) {
    return "La contraseña no puede ser un solo carácter repetido.";
  }

  const weak = [
    "password", "contrasena", "contraseña", "proacademy", "professional",
    "admin", "qwerty", "123456", "iloveyou", "welcome", "letmein",
  ];
  const lowered = password.toLowerCase();
  if (weak.some((w) => lowered.includes(w))) {
    return "La contraseña contiene una palabra demasiado común o predecible.";
  }

  return null;
}

/** Replace the password of one account and invalidate its existing sessions. */
export async function changePassword(userId: number, newPlaintext: string): Promise<void> {
  const hash = await hashPassword(newPlaintext);
  await sql`
    UPDATE admin_users
    SET password_hash = ${hash},
        sessions_valid_from = now(),
        password_changed_at = now(),
        updated_at = now()
    WHERE id = ${userId}
  `;
}

/** Invalidate every session of one account. */
export async function invalidateUserSessions(userId: number): Promise<void> {
  await sql`
    UPDATE admin_users
    SET sessions_valid_from = now(), updated_at = now()
    WHERE id = ${userId}
  `;
}

export async function touchLastLogin(userId: number): Promise<void> {
  await sql`
    UPDATE admin_users SET last_login_at = now(), updated_at = now()
    WHERE id = ${userId}
  `;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export async function createSessionToken(userId: number): Promise<string> {
  return new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

async function loadSessionUser(userId: number): Promise<SessionUser | null> {
  const rows = await sql`
    SELECT u.id, u.email, u.name, u.active, u.sessions_valid_from,
           u.password_changed_at,
           r.id AS role_id, r.slug AS role_slug,
           r.name AS role_name, r.priority AS role_priority
    FROM admin_users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = ${userId}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || !row.active) return null;

  const permissions = await sql`
    SELECT permission_key
    FROM role_permissions
    WHERE role_id = ${row.role_id}
    ORDER BY permission_key
  `;

  return {
    id: row.id as number,
    email: row.email as string,
    name: row.name as string,
    role: {
      id: row.role_id as number,
      slug: row.role_slug as string,
      name: row.role_name as string,
      priority: row.role_priority as number,
    },
    permissions: permissions.map((p) => p.permission_key as string),
    passwordChangedAt: new Date(row.password_changed_at as string),
    sessionsValidFrom: new Date(row.sessions_valid_from as string),
  };
}

async function getSessionUserFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string" || typeof payload.iat !== "number") return null;

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId)) return null;

    const user = await loadSessionUser(userId);
    if (!user) return null;

    // Reject sessions issued before the last password change / global sign-out.
    // iat is in seconds; allow a second of slack for clock rounding.
    const validFromSeconds = Math.floor(user.sessionsValidFrom.getTime() / 1000);
    return payload.iat + 1 >= validFromSeconds ? user : null;
  } catch {
    return null;
  }
}

export async function getSessionUser(cookies: AstroCookies): Promise<SessionUser | null> {
  return getSessionUserFromToken(cookies.get(SESSION_COOKIE)?.value);
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  return Boolean(await getSessionUserFromToken(token));
}

export async function requireSession(cookies: AstroCookies): Promise<boolean> {
  return Boolean(await getSessionUser(cookies));
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

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function isRateLimited(ip: string, email = ""): Promise<boolean> {
  const normalized = normalizeEmail(email);
  const rows = await sql`
    SELECT count(*)::int AS n FROM login_attempts
    WHERE success = false
      AND attempted_at > now() - make_interval(mins => ${WINDOW_MINUTES})
      AND (
        ip = ${ip}
        OR (${normalized} <> '' AND lower(email) = lower(${normalized}))
      )
  `;
  return (rows[0]?.n ?? 0) >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(
  ip: string,
  email: string,
  success: boolean
): Promise<void> {
  const normalized = normalizeEmail(email) || null;
  await sql`
    INSERT INTO login_attempts (ip, email, success)
    VALUES (${ip}, ${normalized}, ${success})
  `;
}

/** Same idea as the login limiter, for sensitive in-panel actions. */
export async function isActionRateLimited(ip: string, action: string): Promise<boolean> {
  const rows = await sql`
    SELECT count(*)::int AS n FROM admin_action_attempts
    WHERE ip = ${ip}
      AND action = ${action}
      AND success = false
      AND attempted_at > now() - make_interval(mins => ${WINDOW_MINUTES})
  `;
  return (rows[0]?.n ?? 0) >= MAX_ATTEMPTS;
}

export async function recordActionAttempt(
  ip: string,
  action: string,
  success: boolean,
  userId?: number
): Promise<void> {
  await sql`
    INSERT INTO admin_action_attempts (ip, action, success, user_id)
    VALUES (${ip}, ${action}, ${success}, ${userId ?? null})
  `;
}
