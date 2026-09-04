/**
 * Applies the admin_credentials / admin_action_attempts tables and seeds the
 * credentials row from ADMIN_PASSWORD_HASH. Safe to re-run.
 */
import fs from "node:fs";
import { neon } from "@neondatabase/serverless";

function readEnv(name) {
  for (const file of [".env.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const m = fs.readFileSync(file, "utf8").match(new RegExp(`^${name}=(.+)$`, "m"));
    if (m) return m[1].trim().replace(/^"|"$/g, "");
  }
  return undefined;
}

const sql = neon(readEnv("DATABASE_URL"));

await sql`
  CREATE TABLE IF NOT EXISTS admin_credentials (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    password_hash TEXT NOT NULL,
    sessions_valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
console.log("✓ admin_credentials");

await sql`
  CREATE TABLE IF NOT EXISTS admin_action_attempts (
    id SERIAL PRIMARY KEY,
    ip TEXT NOT NULL,
    action TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`;
await sql`
  CREATE INDEX IF NOT EXISTS admin_action_attempts_idx
    ON admin_action_attempts (ip, action, attempted_at DESC)
`;
console.log("✓ admin_action_attempts");

const seed = readEnv("ADMIN_PASSWORD_HASH");
if (!seed) {
  console.error("✗ ADMIN_PASSWORD_HASH not found in .env.local/.env — cannot seed.");
  process.exit(1);
}

// Seed with an old validity instant so sessions issued before the migration
// keep working.
const rows = await sql`
  INSERT INTO admin_credentials (id, password_hash, sessions_valid_from)
  VALUES (1, ${seed}, now() - interval '1 day')
  ON CONFLICT (id) DO NOTHING
  RETURNING id
`;
console.log(rows.length ? "✓ credentials row seeded from ADMIN_PASSWORD_HASH" : "· credentials row already existed (left untouched)");

const check = await sql`SELECT id, left(password_hash, 7) AS prefix, sessions_valid_from, password_changed_at FROM admin_credentials`;
console.log(check);
