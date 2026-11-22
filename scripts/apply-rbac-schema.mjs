/**
 * Applies the RBAC migration (0006) to the database in .env.local/.env.
 *
 * Netlify Database applies netlify/database/migrations automatically on deploy;
 * this script is for local/staging databases and for verifying the SQL before
 * pushing.
 *
 *   node scripts/apply-rbac-schema.mjs
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

const url = readEnv("DATABASE_URL_UNPOOLED") || readEnv("DATABASE_URL");
if (!url) {
  console.error("✗ Falta DATABASE_URL_UNPOOLED (o DATABASE_URL) en .env.local/.env.");
  process.exit(1);
}

const sql = neon(url);
const schema = fs.readFileSync(
  new URL("../netlify/database/migrations/0006_rbac.sql", import.meta.url),
  "utf8"
);

// The migration intentionally contains no semicolons inside string literals,
// so splitting on ";" is safe. Comments are stripped line by line first.
const statements = schema
  .split("\n")
  .map((line) => line.replace(/--.*$/, "").trim())
  .filter(Boolean)
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.split("\n")[0].slice(0, 78));
}

const summary = await sql`
  SELECT
    (SELECT count(*)::int FROM roles) AS roles,
    (SELECT count(*)::int FROM permissions) AS permissions,
    (SELECT count(*)::int FROM role_permissions) AS role_permissions,
    (SELECT count(*)::int FROM admin_users) AS admin_users
`;
console.log("\nResumen:", summary[0]);
console.log("RBAC aplicado.");
