-- Durable event log for replay, audit, and recovery
-- Extends the in-memory EventBus with persistent storage
-- RC1 / WS4

CREATE TABLE IF NOT EXISTS event_log (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL,
  payload       jsonb NOT NULL DEFAULT '{}',
  occurred_at   timestamptz NOT NULL,
  org_id        text,
  correlation_id text,
  causation_id   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_log_type         ON event_log (type);
CREATE INDEX IF NOT EXISTS idx_event_log_occurred_at  ON event_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_log_org_id       ON event_log (org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_log_correlation  ON event_log (correlation_id) WHERE correlation_id IS NOT NULL;
