/**
 * Postgres client (Neon serverless driver — HTTP transport).
 *
 * The client is created lazily on the first query, so importing this module
 * (e.g. while the build loads the SSR entry) never requires DATABASE_URL.
 * The connection string is read from process.env at runtime, falling back to
 * the build-time import.meta.env value.
 */
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

let client: Sql | undefined;

function getClient(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL no está definida. Configúrala en las variables de entorno del servidor.",
      );
    }
    client = neon(url);
  }
  return client;
}

// Behaves like neon's tagged-template `sql`, but creates the client lazily on
// the first query instead of at import time.
export const sql: Sql = new Proxy(function () {} as unknown as Sql, {
  apply: (_target, _thisArg, args) =>
    (getClient() as unknown as (...a: unknown[]) => unknown)(...args),
}) as Sql;
