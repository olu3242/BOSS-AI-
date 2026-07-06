-- TD-030: Event Log Compaction
-- Adds archival metadata and a server-side compaction function that deletes
-- events older than a configurable retention window.
-- Default retention: 90 days (configurable per call).

-- Track the most recent compaction run per org so operators can audit it.
CREATE TABLE IF NOT EXISTS event_log_compaction_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          text,
  retention_days  integer NOT NULL DEFAULT 90,
  deleted_count   integer NOT NULL,
  oldest_kept_at  timestamptz,
  ran_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compaction_runs_org_ran
  ON event_log_compaction_runs (org_id, ran_at DESC);

-- compact_event_log(retention_days, org_id):
--   Deletes event_log rows older than retention_days.
--   If org_id is NULL, compacts across all orgs (global sweep).
--   Returns the number of rows deleted.
CREATE OR REPLACE FUNCTION compact_event_log(
  p_retention_days integer DEFAULT 90,
  p_org_id         text    DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff       timestamptz;
  v_deleted      integer;
  v_oldest_kept  timestamptz;
BEGIN
  v_cutoff := now() - (p_retention_days || ' days')::interval;

  IF p_org_id IS NOT NULL THEN
    DELETE FROM event_log
    WHERE occurred_at < v_cutoff
      AND org_id = p_org_id;
  ELSE
    DELETE FROM event_log
    WHERE occurred_at < v_cutoff;
  END IF;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  SELECT MIN(occurred_at) INTO v_oldest_kept
  FROM event_log
  WHERE (p_org_id IS NULL OR org_id = p_org_id);

  INSERT INTO event_log_compaction_runs
    (org_id, retention_days, deleted_count, oldest_kept_at)
  VALUES
    (p_org_id, p_retention_days, v_deleted, v_oldest_kept);

  RETURN v_deleted;
END;
$$;

COMMENT ON FUNCTION compact_event_log(integer, text) IS
  'Delete event_log rows older than retention_days. Pass org_id to scope to one tenant; NULL sweeps all orgs. Records audit row in event_log_compaction_runs.';
