-- Migration 0049: Workflow Sessions (Persistence Engine)
-- Platform-wide table for persisting multi-step workflow progress.
-- Used by onboarding, MRI, integration wizards, billing setup, and any future
-- long-running wizard. Allows resume after refresh, browser close, session
-- expiry, or deployment.

CREATE TABLE IF NOT EXISTS workflow_sessions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL,
  workflow_type     TEXT        NOT NULL,           -- e.g. 'onboarding', 'mri', 'integration'
  status            TEXT        NOT NULL DEFAULT 'in_progress'
                                CHECK (status IN ('in_progress','paused','waiting','retrying','completed','cancelled','expired','archived')),
  current_step      INTEGER     NOT NULL DEFAULT 1,
  completed_steps   INTEGER[]   NOT NULL DEFAULT '{}',
  total_steps       INTEGER     NOT NULL DEFAULT 1,
  progress_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  form_data         JSONB       NOT NULL DEFAULT '{}',
  validation_state  JSONB       NOT NULL DEFAULT '{}',
  metadata          JSONB       NOT NULL DEFAULT '{}',
  correlation_id    UUID        NOT NULL DEFAULT gen_random_uuid(),
  version           INTEGER     NOT NULL DEFAULT 1,
  started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at        TIMESTAMPTZ
);

-- Only one active session per (org, workflow_type) at a time
CREATE UNIQUE INDEX IF NOT EXISTS uq_workflow_sessions_active
  ON workflow_sessions (org_id, workflow_type)
  WHERE status = 'in_progress' AND deleted_at IS NULL;

-- Lookup by user
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_user
  ON workflow_sessions (user_id, status)
  WHERE deleted_at IS NULL;

-- Cleanup expired sessions
CREATE INDEX IF NOT EXISTS idx_workflow_sessions_expires
  ON workflow_sessions (expires_at)
  WHERE status NOT IN ('completed','cancelled','expired','archived') AND deleted_at IS NULL;

COMMENT ON TABLE workflow_sessions IS 'Platform-wide workflow persistence. Enables resume after refresh, logout, or session expiry for any multi-step wizard.';
COMMENT ON COLUMN workflow_sessions.form_data       IS 'JSONB snapshot of all wizard field values';
COMMENT ON COLUMN workflow_sessions.validation_state IS 'Per-field validation results keyed by step and field name';
COMMENT ON COLUMN workflow_sessions.workflow_type   IS 'Logical name: onboarding | mri | integration | invoice | settings';
COMMENT ON COLUMN workflow_sessions.version         IS 'Optimistic concurrency: increment on each write, reject if stale';
