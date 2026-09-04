/**
 * Admin-panel authentication: single-credential login (this is a one-editor
 * admin panel, not a multi-user system) backed by a bcrypt password hash and
 * signed, httpOnly session cookies.
 *
 * The password hash lives in the `admin_credentials` table rather than in the
 * ADMIN_PASSWORD_HASH env var, so the password can be changed from inside the
 * panel without a redeploy. The env var still seeds the row the first time.
 *
 * Sessions carry an issued-at claim that is checked against
 * `sessions_valid_from`: bumping that column (on password change, or "sign out
 * everywhere") immediately invalidates every session already out there.
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

function getSecret(): Uint8Array {
  const secret = import.meta.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  return new TextEncoder().encode(secret);
}

// ---------------------------------------------------------------------------
// Credential storage
// ---------------------------------------------------------------------------

interface Credentials {
  passwordHash: string;
  sessionsValidFrom: Date;
}

/**
 * Read the single credentials row, seeding it from ADMIN_PASSWORD_HASH the
 * first time so an existing deployment keeps working across this migration.
 */
async function getCredentials(): Promise<Credentials> {
  const rows = await sql`
    SELECT password_hash, sessions_valid_from FROM admin_credentials WHERE id = 1
  `;

  if (rows[0]) {
    return {
      passwordHash: rows[0].password_hash as string,
      sessionsValidFrom: new Date(rows[0].sessions_valid_from as string),
    };
  }

  const seed = import.meta.env.ADMIN_PASSWORD_HASH;
  if (!seed) {
    throw new Error(
      "No admin credentials in the database and ADMIN_PASSWORD_HASH is not configured."
    );
  }

  // Seed at an old validity instant so already-issued sessions stay valid
  // through the migration.
  const inserted = await sql`
    INSERT INTO admin_credentials (id, password_hash, sessions_valid_from)
    VALUES (1, ${seed}, now() - interval '1 day')
    ON CONFLICT (id) DO UPDATE SET password_hash = admin_credentials.password_hash
    RETURNING password_hash, sessions_valid_from
  `;

  return {
    passwordHash: inserted[0].password_hash as string,
    sessionsValidFrom: new Date(inserted[0].sessions_valid_from as string),
  };
}

/**
 * A bcrypt hash of a value nobody knows, compared against when there is no
 * stored hash, so a misconfigured install still takes the same amount of time
 * to reject a login as a real wrong-password check would.
 */
const DUMMY_HASH = "$2b$12$Il7TLDDjtZM205FScgtMfeCywLGmxlBXbOUBD6fGFqtH8A9xY8sHK";

export async function verifyPassword(plaintext: string): Promise<boolean> {
  let hash: string;
  try {
    hash = (await getCredentials()).passwordHash;
  } catch {
    await bcrypt.compare(plaintext, DUMMY_HASH);
    throw new Error("Admin credentials are not configured.");
  }
  return bcrypt.compare(plaintext, hash);
}

export async function hashPassword(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
}

// ---------------------------------------------------------------------------
// Password policy
// ---------------------------------------------------------------------------

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

/**
 * Replace the password and invalidate every existing session. The caller is
 * responsible for issuing a fresh cookie for the session doing the change.
 */
export async function changePassword(newPlaintext: string): Promise<void> {
  const hash = await hashPassword(newPlaintext);
  await getCredentials(); // ensure the row exists before updating
  await sql`
    UPDATE admin_credentials
    SET password_hash = ${hash},
        sessions_valid_from = now(),
        password_changed_at = now(),
        updated_at = now()
    WHERE id = 1
  `;
}

/** Invalidate every session currently out there. */
export async function invalidateAllSessions(): Promise<void> {
  await getCredentials();
  await sql`
    UPDATE admin_credentials
    SET sessions_valid_from = now(), updated_at = now()
    WHERE id = 1
  `;
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

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
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (payload.sub !== "admin" || typeof payload.iat !== "number") return false;

    // Reject sessions issued before the last password change / global sign-out.
    const { sessionsValidFrom } = await getCredentials();
    // iat is in seconds; allow a second of slack for clock rounding.
    return payload.iat + 1 >= Math.floor(sessionsValidFrom.getTime() / 1000);
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
// Rate limiting
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

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
  success: boolean
): Promise<void> {
  await sql`
    INSERT INTO admin_action_attempts (ip, action, success)
    VALUES (${ip}, ${action}, ${success})
  `;
}
