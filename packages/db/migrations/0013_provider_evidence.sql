-- Super Batch A / Goal 16A: Provider Evidence
-- Persists per-execution telemetry linking tool executions to real provider
-- outcomes. Provides the audit trail and evidence record required by Law 2.

CREATE TABLE IF NOT EXISTS provider_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL,
  business_id   uuid NOT NULL,
  tool_execution_id uuid NOT NULL REFERENCES tool_executions(id),
  provider_key  text NOT NULL,
  tool_key      text NOT NULL,
  status        text NOT NULL CHECK (status IN ('succeeded', 'failed')),
  latency_ms    numeric NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  error_code    text,
  response_snapshot jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_provider_evidence_org_business
  ON provider_evidence (org_id, business_id);
CREATE INDEX IF NOT EXISTS idx_provider_evidence_tool_execution
  ON provider_evidence (tool_execution_id);
