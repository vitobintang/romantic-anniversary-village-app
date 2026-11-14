import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// The connection is created lazily, on first use, instead of at import time.
// That keeps `next build` (and any page that doesn't touch the DB) working on
// hosts like Vercel where DATABASE_URL isn't necessarily set.
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlDb?: NodePgDatabase;
};

function requiredDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  return databaseUrl;
}

export function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: requiredDatabaseUrl(),
    });
  }

  return globalForDb.__arenaNextJsPostgresqlPool;
}

export function getDb(): NodePgDatabase {
  if (!globalForDb.__arenaNextJsPostgresqlDb) {
    globalForDb.__arenaNextJsPostgresqlDb = drizzle(getPool());
  }

  return globalForDb.__arenaNextJsPostgresqlDb;
}

function lazy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const instance = resolve() as Record<PropertyKey, unknown>;
      const value = instance[prop];
      return typeof value === "function" ? value.bind(instance) : value;
    },
  });
}

/** Connects on first property access (e.g. `db.execute(...)`). */
export const db: NodePgDatabase = lazy(getDb);

/** Connects on first property access (e.g. `pool.query(...)`, `pool.end()`). */
export const pool: Pool = lazy(getPool);
