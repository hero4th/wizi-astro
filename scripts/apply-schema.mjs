import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { config } from "node:process";

// Load .env.local manually (no dotenv dependency).
const envFile = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
for (const line of envFile.split("\n")) {
  const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
}

const sql = neon(process.env.DATABASE_URL_UNPOOLED);
const schema = readFileSync(new URL("./db-schema.sql", import.meta.url), "utf-8");

// Split on blank-line-separated statements isn't safe for SQL in general, but
// this schema file has no semicolons inside string literals, so a naive split
// on ";" is fine here.
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  await sql.query(stmt);
  console.log("OK:", stmt.split("\n")[0].slice(0, 70));
}

console.log("\nSchema applied.");
