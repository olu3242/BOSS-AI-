/**
 * TD-032 — Postgres RLS Integration Test Global Setup
 *
 * Starts a Docker postgres:16-alpine container, runs all migrations,
 * creates a non-superuser role for RLS enforcement, and exports the
 * DATABASE_URL for the test suite. Teardown kills and removes the container.
 */
import { execSync, spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "..", "migrations");
const CONTAINER_NAME = "boss-rls-test-pg";
const PG_PORT = 54399;
const PG_DB = "boss_rls_test";
const PG_USER = "postgres";
const PG_PASS = "postgres";

function dockerAvailable(): boolean {
  const result = spawnSync("docker", ["ps"], { stdio: "ignore" });
  return result.status === 0;
}

async function waitForPostgres(connStr: string, attempts = 30): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const client = new Client({ connectionString: connStr });
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      return;
    } catch {
      await client.end().catch(() => undefined);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error("Postgres container did not become ready in time");
}

async function runMigrations(connStr: string): Promise<void> {
  const client = new Client({ connectionString: connStr });
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((r) => r.name));

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${file} failed: ${String(err)}`);
    }
  }

  // Create a non-superuser role so RLS is enforced (superusers bypass RLS by default)
  await client.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'boss_app') THEN
        CREATE ROLE boss_app NOLOGIN NOINHERIT;
      END IF;
    END
    $$;
  `);
  await client.query("GRANT USAGE ON SCHEMA public TO boss_app");
  await client.query("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO boss_app");
  await client.query("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO boss_app");

  await client.end();
}

export default async function setup(): Promise<void> {
  if (!dockerAvailable()) {
    console.warn("[rls-setup] Docker not available — RLS tests will be skipped");
    return;
  }

  // Remove stale container if present
  spawnSync("docker", ["rm", "-f", CONTAINER_NAME], { stdio: "ignore" });

  execSync(
    [
      "docker run -d",
      `--name ${CONTAINER_NAME}`,
      `-p ${PG_PORT}:5432`,
      `-e POSTGRES_DB=${PG_DB}`,
      `-e POSTGRES_USER=${PG_USER}`,
      `-e POSTGRES_PASSWORD=${PG_PASS}`,
      "postgres:16-alpine",
    ].join(" "),
    { stdio: "ignore" }
  );

  const connStr = `postgresql://${PG_USER}:${PG_PASS}@localhost:${PG_PORT}/${PG_DB}`;
  process.env["RLS_TEST_DATABASE_URL"] = connStr;

  await waitForPostgres(connStr);
  await runMigrations(connStr);
}

export async function teardown(): Promise<void> {
  spawnSync("docker", ["rm", "-f", CONTAINER_NAME], { stdio: "ignore" });
  delete process.env["RLS_TEST_DATABASE_URL"];
}
