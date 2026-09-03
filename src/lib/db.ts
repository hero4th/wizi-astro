/**
 * Postgres client (Neon serverless driver — HTTP transport, safe to call from
 * any Vercel Function without connection-pool exhaustion). Uses the pooled
 * connection string for normal app queries.
 */
import { neon } from "@neondatabase/serverless";

export const sql = neon(import.meta.env.DATABASE_URL);
