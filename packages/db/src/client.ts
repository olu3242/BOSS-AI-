import { Pool, type PoolClient, type QueryResultRow } from "pg";

// Hostnames that are never valid in a production connection string.
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "host.docker.internal", "0.0.0.0"]);

// Bare words (no protocol) that pg-connection-string silently treats as a hostname.
// These are always configuration errors — no real database will ever be reachable at them.
const PLACEHOLDER_HOSTNAMES = new Set(["base", "placeholder", "example", "change-me", "undefined", "null"]);

function validateConnectionString(cs: string): void {
  let hostname: string;
  try {
    hostname = new URL(cs).hostname;
  } catch {
    // pg-connection-string accepts bare words as hostnames (e.g. DATABASE_URL=base → host=base).
    // new URL() rejects them. Treat the whole string as the hostname for diagnostic purposes.
    hostname = cs.trim();
  }

  if (!hostname) {
    throw new Error(
      `[db] DATABASE_URL is set but has no hostname. Value starts with: "${cs.slice(0, 30)}". ` +
        "Set DATABASE_URL to the Supabase Transaction Pooler URL (port 6543, ?pgbouncer=true).",
    );
  }

  if (PLACEHOLDER_HOSTNAMES.has(hostname.toLowerCase())) {
    throw new Error(
      `[db] DATABASE_URL resolves to placeholder hostname "${hostname}". ` +
        "Set DATABASE_URL to the Supabase Transaction Pooler URL " +
        "(Supabase Dashboard → Project Settings → Database → Transaction mode, port 6543).",
    );
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && LOCAL_HOSTNAMES.has(hostname)) {
    throw new Error(
      `[db] DATABASE_URL points to local host "${hostname}" in a production environment. ` +
        "Set DATABASE_URL to the Supabase Transaction Pooler URL (port 6543, ?pgbouncer=true).",
    );
  }
}

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/boss_dev";
    validateConnectionString(connectionString);
    const isLocal =
      connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
    pool = new Pool({
      connectionString,
      ssl: isLocal ? false : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export function firstRow<T>(rows: T[]): T {
  const row = rows[0];
  if (!row) {
    throw new Error("Expected at least one row but query returned none.");
  }
  return row;
}

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
