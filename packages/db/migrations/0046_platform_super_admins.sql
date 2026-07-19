-- Migration 0046: Platform Super Admins
-- Cross-tenant, platform-level privileged role.
-- No org_id — intentionally tenant-free.
-- Rollback: DROP TABLE IF EXISTS platform_super_admins CASCADE;
--           DROP FUNCTION IF EXISTS boss_is_super_admin(text);

CREATE TABLE platform_super_admins (
  user_id       text        PRIMARY KEY,
  granted_by    text        NOT NULL,
  granted_at    timestamptz NOT NULL DEFAULT now(),
  revoked_at    timestamptz,
  notes         text
);

CREATE INDEX idx_platform_super_admins_active
  ON platform_super_admins(user_id)
  WHERE revoked_at IS NULL;

-- Helper callable from RLS policies and application code.
CREATE OR REPLACE FUNCTION boss_is_super_admin(p_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_super_admins
    WHERE user_id = p_user_id
      AND revoked_at IS NULL
  );
$$;

-- Platform super admin audit log.
CREATE TABLE platform_audit_events (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id      text        NOT NULL,
  action        text        NOT NULL,
  resource_type text        NOT NULL,
  resource_id   text,
  outcome       text        NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  trace_id      text        NOT NULL,
  metadata      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  occurred_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_audit_actor_time
  ON platform_audit_events(actor_id, occurred_at DESC);

CREATE INDEX idx_platform_audit_action_time
  ON platform_audit_events(action, occurred_at DESC);

-- Only service role (used by API) can mutate platform_super_admins.
-- Regular JWT sessions cannot escalate themselves.
ALTER TABLE platform_super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_events ENABLE ROW LEVEL SECURITY;

-- Super admins can read the full list; others see nothing.
CREATE POLICY platform_super_admins_read ON platform_super_admins
  FOR SELECT
  USING (boss_is_super_admin(boss_current_user_id()));

CREATE POLICY platform_audit_events_super_admin_read ON platform_audit_events
  FOR SELECT
  USING (boss_is_super_admin(boss_current_user_id()));
