-- Migration 0041: Workflow Definitions (user-owned, versioned)
-- Rollback: DROP TABLE IF EXISTS workflows CASCADE;

CREATE TABLE IF NOT EXISTS workflows (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL,
  business_id   uuid        NOT NULL,
  name          text        NOT NULL,
  description   text,
  trigger_event text        NOT NULL,
  status        text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  version       integer     NOT NULL DEFAULT 1 CHECK (version >= 1),
  configuration jsonb       NOT NULL DEFAULT '{}',
  owner_id      text,
  tags          text[]      NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_workflows_org_business
  ON workflows(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_workflows_trigger
  ON workflows(org_id, trigger_event) WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX IF NOT EXISTS idx_workflows_status
  ON workflows(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY workflows_tenant_policy ON workflows
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
