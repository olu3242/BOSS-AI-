import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");
const NAME_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;

function listMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

function validateNamingAndSequence(files: string[]): void {
  let previous = 0;
  for (const file of files) {
    const match = NAME_PATTERN.exec(file);
    if (!match) {
      throw new Error(`Migration file "${file}" does not match required pattern NNNN_description.sql`);
    }
    const sequenceText = match[1] ?? "";
    const sequence = Number.parseInt(sequenceText, 10);
    if (sequence !== previous + 1) {
      throw new Error(
        `Migration sequence gap: expected ${String(previous + 1).padStart(4, "0")}, found ${sequenceText} ("${file}")`
      );
    }
    previous = sequence;
  }
}

async function validateApplyCleanly(files: string[]): Promise<void> {
  const schema = `validate_migrations_${Date.now()}`;
  const adminUrl = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/boss_dev";
  const pool = new Pool({ connectionString: adminUrl });

  try {
    await pool.query(`CREATE SCHEMA "${schema}"`);
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${schema}"`);
      for (const file of files) {
        const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
        await client.query(sql);
      }
    } finally {
      client.release();
    }
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await pool.end();
  }
}

async function main(): Promise<void> {
  const files = listMigrationFiles();
  if (files.length === 0) {
    throw new Error("No migration files found.");
  }
  validateNamingAndSequence(files);
  await validateApplyCleanly(files);
  console.log(`Validated ${files.length} migration(s): ${files.join(", ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
