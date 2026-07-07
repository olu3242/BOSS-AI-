-- TD-020: Dedicated Execution Metrics Table
-- Stores rolled-up P50/P95/P99 latency and success/failure counts per workflow.
-- Materialized by refresh_execution_metrics() — call from a daily scheduler job
-- or after a batch of workflow_runs complete.

CREATE TABLE IF NOT EXISTS execution_metrics (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid        NOT NULL,
  workflow_id     uuid        NOT NULL,
  window_start    timestamptz NOT NULL,
  window_end      timestamptz NOT NULL,
  run_count       integer     NOT NULL DEFAULT 0,
  success_count   integer     NOT NULL DEFAULT 0,
  failure_count   integer     NOT NULL DEFAULT 0,
  p50_ms          integer,
  p95_ms          integer,
  p99_ms          integer,
  min_ms          integer,
  max_ms          integer,
  computed_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, workflow_id, window_start, window_end)
);

CREATE INDEX IF NOT EXISTS idx_execution_metrics_org_workflow
  ON execution_metrics (org_id, workflow_id, window_start DESC);

ALTER TABLE execution_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY execution_metrics_tenant_policy ON execution_metrics
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- refresh_execution_metrics(window_hours):
--   Recomputes metrics for all org/workflow combinations over the last N hours.
--   Upserts into execution_metrics (idempotent via the unique constraint).
CREATE OR REPLACE FUNCTION refresh_execution_metrics(p_window_hours integer DEFAULT 24)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_window_start timestamptz;
  v_window_end   timestamptz;
  v_upserted     integer := 0;
BEGIN
  v_window_end   := now();
  v_window_start := v_window_end - (p_window_hours || ' hours')::interval;

  INSERT INTO execution_metrics (
    org_id, workflow_id,
    window_start, window_end,
    run_count, success_count, failure_count,
    p50_ms, p95_ms, p99_ms,
    min_ms, max_ms,
    computed_at
  )
  SELECT
    r.org_id,
    r.workflow_id,
    v_window_start,
    v_window_end,
    COUNT(*)::integer                                        AS run_count,
    COUNT(*) FILTER (WHERE r.status = 'completed')::integer AS success_count,
    COUNT(*) FILTER (WHERE r.status = 'failed')::integer    AS failure_count,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY r.duration_ms)::integer AS p50_ms,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY r.duration_ms)::integer AS p95_ms,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY r.duration_ms)::integer AS p99_ms,
    MIN(r.duration_ms)::integer  AS min_ms,
    MAX(r.duration_ms)::integer  AS max_ms,
    now()
  FROM workflow_runs r
  WHERE r.completed_at >= v_window_start
    AND r.completed_at < v_window_end
    AND r.duration_ms IS NOT NULL
    AND r.deleted_at IS NULL
  GROUP BY r.org_id, r.workflow_id
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
    computed_at   = EXCLUDED.computed_at;

  GET DIAGNOSTICS v_upserted = ROW_COUNT;
  RETURN v_upserted;
END;
$$;

COMMENT ON FUNCTION refresh_execution_metrics(integer) IS
  'Recompute P50/P95/P99 execution metrics for all workflows over the last N hours. Idempotent.';
