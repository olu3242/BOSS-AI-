-- Migration 0042: Workflow Runs (business execution record)
-- Rollback: DROP TABLE IF EXISTS workflow_runs CASCADE;

CREATE TABLE IF NOT EXISTS workflow_runs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid        NOT NULL,
  business_id           uuid        NOT NULL,
  workflow_id           uuid        NOT NULL,
  status                text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','completed','failed','cancelled')),
  triggered_by          text        NOT NULL,
  business_object_type  text,
  business_object_id    text,
  runtime_execution_id  text,
  result                jsonb,
  error_message         text,
  duration_ms           integer,
  started_at            timestamptz,
  completed_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_org_business
  ON workflow_runs(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow
  ON workflow_runs(org_id, workflow_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_runs_object
  ON workflow_runs(org_id, business_object_type, business_object_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status
  ON workflow_runs(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflow_runs_tenant_policy ON workflow_runs
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
