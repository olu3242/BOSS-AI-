/**
 * TD-032 — Postgres RLS Integration Tests
 *
 * Validates that Row Level Security policies on the real Postgres schema
 * enforce per-tenant isolation. Requires Docker (skips cleanly without it).
 *
 * Each test:
 *  1. Connects as a non-superuser role (boss_app) so RLS is enforced
 *  2. Sets app.current_org_id for a specific tenant
 *  3. Inserts rows for org-A and org-B as superuser
 *  4. Confirms that a query scoped to org-A cannot see org-B rows
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

const connStr = process.env["RLS_TEST_DATABASE_URL"];
const skip = !connStr;

// Superuser client for setup (inserts bypass RLS)
let superClient: Client;
// App-role client — RLS is enforced here
let appClient: Client;

beforeAll(async () => {
  if (skip) return;
  superClient = new Client({ connectionString: connStr });
  await superClient.connect();

  // App client connects as superuser but immediately SET ROLE to boss_app
  // so that subsequent queries are subject to RLS.
  appClient = new Client({ connectionString: connStr });
  await appClient.connect();
  await appClient.query("SET ROLE boss_app");
});

afterAll(async () => {
  if (skip) return;
  await superClient?.end();
  await appClient?.end();
});

async function asOrg(orgId: string, fn: (client: Client) => Promise<void>): Promise<void> {
  // Use a savepoint so the SET LOCAL is scoped to this block
  await appClient.query("BEGIN");
  await appClient.query("SET LOCAL app.current_org_id = $1", [orgId]);
  try {
    await fn(appClient);
  } finally {
    await appClient.query("ROLLBACK");
  }
}

describe.skipIf(skip)("Postgres RLS — cross-tenant isolation", () => {
  const orgA = randomUUID();
  const orgB = randomUUID();

  // ── workflow_executions (migration 0018) ───────────────────────────────────

  describe("workflow_executions", () => {
    const wfA = randomUUID();
    const wfB = randomUUID();
    const bizId = randomUUID();

    beforeAll(async () => {
      if (skip) return;
      await superClient.query(
        `INSERT INTO workflow_executions
           (id, org_id, business_id, workflow_id, status, trigger_type, trigger_payload, current_step_index)
         VALUES ($1, $2, $3, $4, 'pending', 'manual', '{}', 0),
                ($5, $6, $3, $4, 'pending', 'manual', '{}', 0)`,
        [wfA, orgA, bizId, randomUUID(), wfB, orgB]
      );
    });

    it("org-A sees only its own workflow_executions", async () => {
      await asOrg(orgA, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM workflow_executions WHERE id IN ($1, $2)",
          [wfA, wfB]
        );
        const ids = rows.map((r: { id: string }) => r.id);
        expect(ids).toContain(wfA);
        expect(ids).not.toContain(wfB);
      });
    });

    it("org-B sees only its own workflow_executions", async () => {
      await asOrg(orgB, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM workflow_executions WHERE id IN ($1, $2)",
          [wfA, wfB]
        );
        const ids = rows.map((r: { id: string }) => r.id);
        expect(ids).toContain(wfB);
        expect(ids).not.toContain(wfA);
      });
    });

    it("cross-tenant direct ID lookup returns empty", async () => {
      await asOrg(orgA, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM workflow_executions WHERE id = $1",
          [wfB]
        );
        expect(rows).toHaveLength(0);
      });
    });
  });

  // ── jobs (migration 0026) ──────────────────────────────────────────────────

  describe("jobs", () => {
    const jobA = randomUUID();
    const jobB = randomUUID();
    const bizId = randomUUID();

    beforeAll(async () => {
      if (skip) return;
      await superClient.query(
        `INSERT INTO jobs
           (id, org_id, business_id, title, status, priority)
         VALUES ($1, $2, $3, 'Job A', 'draft', 'normal'),
                ($4, $5, $3, 'Job B', 'draft', 'normal')`,
        [jobA, orgA, bizId, jobB, orgB]
      );
    });

    it("org-A cannot read org-B jobs", async () => {
      await asOrg(orgA, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM jobs WHERE id IN ($1, $2)",
          [jobA, jobB]
        );
        const ids = rows.map((r: { id: string }) => r.id);
        expect(ids).toContain(jobA);
        expect(ids).not.toContain(jobB);
      });
    });

    it("org-B write check blocks cross-tenant insert", async () => {
      await asOrg(orgA, async (client) => {
        // Attempt to insert a row claiming orgB ownership — RLS WITH CHECK rejects it
        await expect(
          client.query(
            `INSERT INTO jobs (id, org_id, business_id, title, status, priority)
             VALUES ($1, $2, $3, 'Evil job', 'draft', 'normal')`,
            [randomUUID(), orgB, bizId]
          )
        ).rejects.toThrow();
      });
    });
  });

  // ── appointments (migration 0027) ─────────────────────────────────────────

  describe("appointments", () => {
    const apptA = randomUUID();
    const apptB = randomUUID();
    const bizId = randomUUID();

    beforeAll(async () => {
      if (skip) return;
      const now = new Date();
      const later = new Date(now.getTime() + 3600_000);
      await superClient.query(
        `INSERT INTO appointments
           (id, org_id, business_id, title, status, start_at, end_at)
         VALUES ($1, $2, $3, 'Appt A', 'scheduled', $4, $5),
                ($6, $7, $3, 'Appt B', 'scheduled', $4, $5)`,
        [apptA, orgA, bizId, now.toISOString(), later.toISOString(), apptB, orgB]
      );
    });

    it("org-A cannot read org-B appointments", async () => {
      await asOrg(orgA, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM appointments WHERE id IN ($1, $2)",
          [apptA, apptB]
        );
        const ids = rows.map((r: { id: string }) => r.id);
        expect(ids).toContain(apptA);
        expect(ids).not.toContain(apptB);
      });
    });
  });

  // ── invoices (migration 0028) ──────────────────────────────────────────────

  describe("invoices", () => {
    const invA = randomUUID();
    const invB = randomUUID();
    const bizId = randomUUID();

    beforeAll(async () => {
      if (skip) return;
      await superClient.query(
        `INSERT INTO invoices
           (id, org_id, business_id, invoice_number, status, subtotal_cents, tax_cents, total_cents, currency, issued_at)
         VALUES ($1, $2, $3, 'INV-A-001', 'draft', 10000, 0, 10000, 'USD', now()),
                ($4, $5, $3, 'INV-B-001', 'draft', 20000, 0, 20000, 'USD', now())`,
        [invA, orgA, bizId, invB, orgB]
      );
    });

    it("org-A cannot read org-B invoices", async () => {
      await asOrg(orgA, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM invoices WHERE id IN ($1, $2)",
          [invA, invB]
        );
        const ids = rows.map((r: { id: string }) => r.id);
        expect(ids).toContain(invA);
        expect(ids).not.toContain(invB);
      });
    });
  });

  // ── agent_executions (migration 0018) ─────────────────────────────────────

  describe("agent_executions", () => {
    const aeA = randomUUID();
    const aeB = randomUUID();
    const bizId = randomUUID();

    beforeAll(async () => {
      if (skip) return;
      await superClient.query(
        `INSERT INTO agent_executions
           (id, org_id, business_id, employee_key, status, input, output)
         VALUES ($1, $2, $3, 'ceo_advisor', 'completed', '{}', '{}'),
                ($4, $5, $3, 'ceo_advisor', 'completed', '{}', '{}')`,
        [aeA, orgA, bizId, aeB, orgB]
      );
    });

    it("org-A cannot read org-B agent_executions", async () => {
      await asOrg(orgA, async (client) => {
        const { rows } = await client.query(
          "SELECT id FROM agent_executions WHERE id IN ($1, $2)",
          [aeA, aeB]
        );
        const ids = rows.map((r: { id: string }) => r.id);
        expect(ids).toContain(aeA);
        expect(ids).not.toContain(aeB);
      });
    });
  });

  // ── empty org sees nothing ─────────────────────────────────────────────────

  it("a third org with no data sees zero rows across all tested tables", async () => {
    const orgC = randomUUID();
    await asOrg(orgC, async (client) => {
      for (const table of ["workflow_executions", "jobs", "appointments", "invoices", "agent_executions"]) {
        const { rows } = await client.query(`SELECT id FROM ${table}`);
        expect(rows, `${table} should be empty for org-C`).toHaveLength(0);
      }
    });
  });
});
