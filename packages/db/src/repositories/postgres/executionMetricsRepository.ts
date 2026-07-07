import { query } from "../../client.js";
import type { ExecutionMetricsEntry, ExecutionMetricsRepository } from "../types.js";

interface ExecutionMetricsRow {
  id: string;
  org_id: string;
  workflow_id: string;
  window_start: string;
  window_end: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  min_ms: number | null;
  max_ms: number | null;
  computed_at: string;
}

function toEntry(row: ExecutionMetricsRow): ExecutionMetricsEntry {
  return {
    id: row.id,
    orgId: row.org_id,
    workflowId: row.workflow_id,
    windowStart: row.window_start,
    windowEnd: row.window_end,
    runCount: row.run_count,
    successCount: row.success_count,
    failureCount: row.failure_count,
    p50Ms: row.p50_ms,
    p95Ms: row.p95_ms,
    p99Ms: row.p99_ms,
    minMs: row.min_ms,
    maxMs: row.max_ms,
    computedAt: row.computed_at,
  };
}

export function createPostgresExecutionMetricsRepository(): ExecutionMetricsRepository {
  return {
    async latestForWorkflow(orgId, workflowId) {
      const rows = await query<ExecutionMetricsRow>(
        `SELECT * FROM execution_metrics
         WHERE org_id = $1 AND workflow_id = $2
         ORDER BY window_start DESC LIMIT 1`,
        [orgId, workflowId]
      );
      return rows[0] ? toEntry(rows[0]) : null;
    },

    async listByOrg(orgId, limit = 100) {
      const rows = await query<ExecutionMetricsRow>(
        `SELECT * FROM execution_metrics
         WHERE org_id = $1
         ORDER BY window_start DESC LIMIT $2`,
        [orgId, limit]
      );
      return rows.map(toEntry);
    },

    async upsert(entry) {
      const rows = await query<ExecutionMetricsRow>(
        `INSERT INTO execution_metrics
           (org_id, workflow_id, window_start, window_end,
            run_count, success_count, failure_count,
            p50_ms, p95_ms, p99_ms, min_ms, max_ms)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (org_id, workflow_id, window_start, window_end)
         DO UPDATE SET
           run_count     = EXCLUDED.run_count,
           success_count = EXCLUDED.success_count,
           failure_count = EXCLUDED.failure_count,
           p50_ms        = EXCLUDED.p50_ms,
           p95_ms        = EXCLUDED.p95_ms,
           p99_ms        = EXCLUDED.p99_ms,
           min_ms        = EXCLUDED.min_ms,
           max_ms        = EXCLUDED.max_ms,
           computed_at   = now()
         RETURNING *`,
        [
          entry.orgId, entry.workflowId, entry.windowStart, entry.windowEnd,
          entry.runCount, entry.successCount, entry.failureCount,
          entry.p50Ms ?? null, entry.p95Ms ?? null, entry.p99Ms ?? null,
          entry.minMs ?? null, entry.maxMs ?? null,
        ]
      );
      return toEntry(rows[0]!);
    },

    async refresh(windowHours = 24) {
      const rows = await query<{ refresh_execution_metrics: number }>(
        `SELECT refresh_execution_metrics($1) AS refresh_execution_metrics`,
        [windowHours]
      );
      return rows[0]?.refresh_execution_metrics ?? 0;
    },
  };
}
