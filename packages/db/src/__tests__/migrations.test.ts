import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "..", "migrations");
const NAME_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/;

describe("migration file conventions", () => {
  it("uses sequential NNNN_description.sql naming with no gaps", () => {
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    expect(files.length).toBeGreaterThan(0);

    let previous = 0;
    for (const file of files) {
      const match = NAME_PATTERN.exec(file);
      expect(match, `"${file}" must match NNNN_description.sql`).not.toBeNull();
      const sequence = Number.parseInt(match![1]!, 10);
      expect(sequence).toBe(previous + 1);
      previous = sequence;
    }
  });
});
