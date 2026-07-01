import { readFileSync, readdirSync } from "node:fs";
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

  it("defines tenant-scoped durable runtime state and worker leasing", () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, "0018_runtime_durability.sql"),
      "utf-8",
    );

    for (const table of [
      "workflow_executions",
      "runtime_jobs",
      "runtime_schedules",
      "runtime_events",
      "agent_executions",
      "runtime_checkpoints",
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain("uq_runtime_jobs_idempotency");
    expect(sql).toContain("uq_runtime_schedules_idempotency");
    expect(sql).toContain("lease_expires_at");
    expect(sql).toContain("boss_current_org_id()");
  });

  it("defines durable MVP journey metrics", () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, "0019_mvp_journey_metrics.sql"),
      "utf-8",
    );

    expect(sql).toContain("CREATE TABLE mvp_journey_events");
    expect(sql).toContain("UNIQUE (journey_id, stage)");
    expect(sql).toContain(
      "ALTER TABLE mvp_journey_events ENABLE ROW LEVEL SECURITY",
    );
    expect(sql).toContain("'first_value_visible'");
  });

  it("defines normalized tenant-scoped diagnostic outputs", () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, "0020_business_diagnostic_engine.sql"),
      "utf-8",
    );
    for (const table of [
      "diagnostic_reports",
      "diagnostic_area_scores",
      "diagnostic_root_causes",
      "diagnostic_opportunities",
      "diagnostic_maturity_assessments",
      "diagnostic_priority_items",
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain("UNIQUE (business_id, version)");
    expect(sql).toContain("executive_summary jsonb NOT NULL");
  });

  it("defines durable identity organizations with tenant isolation", () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, "0021_identity_organizations.sql"),
      "utf-8",
    );

    for (const table of [
      "organizations",
      "organization_memberships",
      "user_tenant_preferences",
      "identity_audit_events",
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }
    expect(sql).toContain("CREATE OR REPLACE FUNCTION boss_current_user_id()");
    expect(sql).toContain("organizations_member_select");
    expect(sql).toContain("memberships_self_select");
    expect(sql).toContain("tenant_preferences_self_policy");
    expect(sql).toMatch(
      /membership\.organization_id\s*=\s*user_tenant_preferences\.active_organization_id/,
    );
    expect(sql).toContain("identity_audit_member_select");
    expect(sql).toContain("idx_identity_audit_tenant_time");
    expect(sql).toContain("PRIMARY KEY (organization_id, user_id)");
  });

  it("defines versioned tenant-scoped canonical Business Context", () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, "0022_business_discovery_context.sql"),
      "utf-8",
    );
    for (const table of [
      "business_discoveries",
      "business_context_versions",
      "business_discovery_history",
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`org_id = boss_current_org_id()`);
    }
    expect(sql).toContain("UNIQUE (org_id, business_id)");
    expect(sql).toContain("UNIQUE (discovery_id, version)");
    expect(sql).toContain("lock_version integer NOT NULL");
    expect(sql).toContain("correlation_id text NOT NULL");
    expect(sql).toContain("trace_id text NOT NULL");
  });

  it("defines normalized, versioned tenant-scoped Business Knowledge Graphs", () => {
    const sql = readFileSync(
      join(MIGRATIONS_DIR, "0023_business_knowledge_graph.sql"),
      "utf-8",
    );
    for (const table of [
      "business_graphs",
      "business_graph_nodes",
      "business_graph_edges",
      "business_graph_snapshots",
      "business_graph_history",
    ]) {
      expect(sql).toContain(`CREATE TABLE ${table}`);
      expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toContain(`org_id = boss_current_org_id()`);
    }
    expect(sql).toContain("UNIQUE (org_id, business_id)");
    expect(sql).toContain("UNIQUE (graph_id, version)");
    expect(sql).toContain("lock_version integer NOT NULL");
    expect(sql.match(/lock_version integer NOT NULL/g)).toHaveLength(2);
    expect(sql).toContain("source_node_id text NOT NULL");
    expect(sql).toContain("target_node_id text NOT NULL");
    expect(sql).toContain("FOREIGN KEY (graph_id, org_id)");
    expect(sql).toContain(
      "FOREIGN KEY (graph_id, source_node_id, org_id)",
    );
    expect(sql).toContain(
      "REFERENCES business_graph_nodes(graph_id, node_id, org_id)",
    );
    expect(sql).toContain("correlation_id text NOT NULL");
    expect(sql).toContain("trace_id text NOT NULL");
  });
});
