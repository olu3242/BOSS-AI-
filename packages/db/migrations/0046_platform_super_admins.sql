-- Migration 0046: Secure Platform Super Administration
-- Cross-tenant platform RBAC with explicit permissions and immutable audit.
-- Bootstrap is performed only by the API after Supabase identity verification.

CREATE TABLE IF NOT EXISTS platform_roles (
  role_key text PRIMARY KEY,
  name text NOT NULL,
  hierarchy_level integer NOT NULL CHECK (hierarchy_level BETWEEN 1 AND 1000),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_permissions (
  permission_key text PRIMARY KEY,
  domain text NOT NULL,
  action text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain, action)
);

CREATE TABLE IF NOT EXISTS platform_role_permissions (
  role_key text NOT NULL REFERENCES platform_roles(role_key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES platform_permissions(permission_key) ON DELETE CASCADE,
  conditions jsonb NOT NULL DEFAULT '{"assignment_status":"active"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_key, permission_key)
);

CREATE TABLE IF NOT EXISTS platform_super_admins (
  user_id text PRIMARY KEY,
  role_key text NOT NULL DEFAULT 'platform_super_admin'
    REFERENCES platform_roles(role_key),
  granted_by text NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500)
);

ALTER TABLE platform_super_admins
  ADD COLUMN IF NOT EXISTS role_key text;

UPDATE platform_super_admins
SET role_key = 'platform_super_admin'
WHERE role_key IS NULL;

ALTER TABLE platform_super_admins
  ALTER COLUMN role_key SET DEFAULT 'platform_super_admin',
  ALTER COLUMN role_key SET NOT NULL;

CREATE TABLE IF NOT EXISTS platform_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  trace_id text NOT NULL,
  correlation_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_audit_events
  ADD COLUMN IF NOT EXISTS correlation_id text;

UPDATE platform_audit_events
SET correlation_id = trace_id
WHERE correlation_id IS NULL;

ALTER TABLE platform_audit_events
  ALTER COLUMN correlation_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_super_admins_active
  ON platform_super_admins(user_id)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_platform_audit_actor_time
  ON platform_audit_events(actor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_audit_action_time
  ON platform_audit_events(action, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_role_permissions_permission
  ON platform_role_permissions(permission_key, role_key);

INSERT INTO platform_roles (role_key, name, hierarchy_level, description) VALUES
  ('platform_super_admin', 'Platform Super Administrator', 1000, 'Founder-level platform control with every explicitly assigned platform permission.'),
  ('platform_admin', 'Platform Administrator', 800, 'Day-to-day platform administration without founder bootstrap or emergency authority.'),
  ('support_operator', 'Support Operator', 400, 'Customer support and operational diagnostics with limited mutation rights.'),
  ('platform_auditor', 'Platform Auditor', 300, 'Read-only security, compliance, audit, and monitoring access.')
ON CONFLICT (role_key) DO UPDATE SET
  name = EXCLUDED.name,
  hierarchy_level = EXCLUDED.hierarchy_level,
  description = EXCLUDED.description;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'platform_super_admins_role_key_fkey'
  ) THEN
    ALTER TABLE platform_super_admins
      ADD CONSTRAINT platform_super_admins_role_key_fkey
      FOREIGN KEY (role_key) REFERENCES platform_roles(role_key);
  END IF;
END
$$;

INSERT INTO platform_permissions (permission_key, domain, action, description) VALUES
  ('platform.dashboard.read', 'platform', 'dashboard.read', 'View the platform administration dashboard.'),
  ('platform.organizations.read', 'organizations', 'read', 'List and inspect organizations across the platform.'),
  ('platform.organizations.create', 'organizations', 'create', 'Create organizations through the platform service.'),
  ('platform.organizations.update', 'organizations', 'update', 'Update organization platform attributes.'),
  ('platform.organizations.suspend', 'organizations', 'suspend', 'Suspend an organization.'),
  ('platform.organizations.restore', 'organizations', 'restore', 'Restore a suspended organization.'),
  ('platform.organizations.delete', 'organizations', 'delete', 'Soft-delete an organization through an audited workflow.'),
  ('platform.users.read', 'users', 'read', 'List and inspect platform users.'),
  ('platform.users.update', 'users', 'update', 'Update platform user state through identity services.'),
  ('platform.identity.read', 'identity', 'read', 'Inspect identity state and sessions.'),
  ('platform.identity.manage', 'identity', 'manage', 'Manage verified platform identities.'),
  ('platform.security.read', 'security', 'read', 'Inspect platform security configuration and findings.'),
  ('platform.security.manage', 'security', 'manage', 'Manage platform security controls.'),
  ('platform.rbac.read', 'rbac', 'read', 'Inspect platform roles and assignments.'),
  ('platform.rbac.manage', 'rbac', 'manage', 'Manage platform role assignments.'),
  ('platform.abac.read', 'abac', 'read', 'Inspect attribute-based access policies.'),
  ('platform.abac.manage', 'abac', 'manage', 'Manage attribute-based access policies.'),
  ('platform.billing.read', 'billing', 'read', 'Inspect billing state.'),
  ('platform.billing.manage', 'billing', 'manage', 'Manage billing operations.'),
  ('platform.subscriptions.read', 'subscriptions', 'read', 'Inspect subscriptions.'),
  ('platform.subscriptions.manage', 'subscriptions', 'manage', 'Manage subscriptions.'),
  ('platform.marketplace.read', 'marketplace', 'read', 'Inspect marketplace catalog and installations.'),
  ('platform.marketplace.manage', 'marketplace', 'manage', 'Manage marketplace catalog and installations.'),
  ('platform.ai_agents.read', 'ai_agents', 'read', 'Inspect AI agents.'),
  ('platform.ai_agents.manage', 'ai_agents', 'manage', 'Manage AI agents.'),
  ('platform.knowledge.read', 'knowledge', 'read', 'Inspect platform knowledge resources.'),
  ('platform.knowledge.manage', 'knowledge', 'manage', 'Manage platform knowledge resources.'),
  ('platform.workflows.read', 'workflows', 'read', 'Inspect workflows.'),
  ('platform.workflows.manage', 'workflows', 'manage', 'Manage workflows.'),
  ('platform.automation.read', 'automation', 'read', 'Inspect automation policies.'),
  ('platform.automation.manage', 'automation', 'manage', 'Manage automation policies.'),
  ('platform.runtime.read', 'runtime', 'read', 'Inspect runtime state.'),
  ('platform.runtime.manage', 'runtime', 'manage', 'Manage runtime operations.'),
  ('platform.workers.read', 'workers', 'read', 'Inspect background workers.'),
  ('platform.workers.manage', 'workers', 'manage', 'Manage background workers.'),
  ('platform.queues.read', 'queues', 'read', 'Inspect queues.'),
  ('platform.queues.manage', 'queues', 'manage', 'Manage queues.'),
  ('platform.events.read', 'events', 'read', 'Inspect platform events.'),
  ('platform.events.manage', 'events', 'manage', 'Manage event operations.'),
  ('platform.analytics.read', 'analytics', 'read', 'Inspect platform analytics.'),
  ('platform.analytics.manage', 'analytics', 'manage', 'Manage analytics configuration.'),
  ('platform.audit.read', 'audit', 'read', 'Read immutable platform audit events.'),
  ('platform.audit.export', 'audit', 'export', 'Export platform audit evidence.'),
  ('platform.compliance.read', 'compliance', 'read', 'Inspect compliance controls and evidence.'),
  ('platform.compliance.manage', 'compliance', 'manage', 'Manage compliance controls.'),
  ('platform.feature_flags.read', 'feature_flags', 'read', 'Inspect feature flags.'),
  ('platform.feature_flags.manage', 'feature_flags', 'manage', 'Manage feature flags.'),
  ('platform.configuration.read', 'configuration', 'read', 'Inspect sanitized system configuration.'),
  ('platform.configuration.manage', 'configuration', 'manage', 'Manage system configuration.'),
  ('platform.integrations.read', 'integrations', 'read', 'Inspect integrations.'),
  ('platform.integrations.manage', 'integrations', 'manage', 'Manage integrations.'),
  ('platform.monitoring.read', 'monitoring', 'read', 'Inspect monitoring and health.'),
  ('platform.monitoring.manage', 'monitoring', 'manage', 'Manage monitoring configuration.'),
  ('platform.emergency.read', 'emergency', 'read', 'Inspect emergency operations state.'),
  ('platform.emergency.execute', 'emergency', 'execute', 'Execute explicitly authorized emergency operations.'),
  ('platform.support.read', 'support', 'read', 'Inspect support operations.'),
  ('platform.support.manage', 'support', 'manage', 'Manage support operations.'),
  ('platform.super_admins.read', 'super_admins', 'read', 'List Platform Super Administrator assignments.'),
  ('platform.super_admins.grant', 'super_admins', 'grant', 'Grant Platform Super Administrator through the governed workflow.'),
  ('platform.super_admins.revoke', 'super_admins', 'revoke', 'Revoke Platform Super Administrator through the governed workflow.')
ON CONFLICT (permission_key) DO UPDATE SET
  domain = EXCLUDED.domain,
  action = EXCLUDED.action,
  description = EXCLUDED.description;

INSERT INTO platform_role_permissions (role_key, permission_key)
SELECT 'platform_super_admin', permission_key
FROM platform_permissions
ON CONFLICT (role_key, permission_key) DO NOTHING;

INSERT INTO platform_role_permissions (role_key, permission_key)
SELECT 'platform_admin', permission_key
FROM platform_permissions
WHERE permission_key NOT IN (
  'platform.emergency.execute',
  'platform.super_admins.grant',
  'platform.super_admins.revoke',
  'platform.security.manage',
  'platform.rbac.manage',
  'platform.abac.manage'
)
ON CONFLICT (role_key, permission_key) DO NOTHING;

INSERT INTO platform_role_permissions (role_key, permission_key)
SELECT 'platform_auditor', permission_key
FROM platform_permissions
WHERE action IN ('read', 'export', 'dashboard.read')
ON CONFLICT (role_key, permission_key) DO NOTHING;

INSERT INTO platform_role_permissions (role_key, permission_key)
SELECT 'support_operator', permission_key
FROM platform_permissions
WHERE permission_key IN (
  'platform.dashboard.read',
  'platform.organizations.read',
  'platform.users.read',
  'platform.identity.read',
  'platform.runtime.read',
  'platform.workers.read',
  'platform.queues.read',
  'platform.events.read',
  'platform.audit.read',
  'platform.monitoring.read',
  'platform.support.read',
  'platform.support.manage'
)
ON CONFLICT (role_key, permission_key) DO NOTHING;

CREATE OR REPLACE FUNCTION boss_is_super_admin(p_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM platform_super_admins
    WHERE user_id = p_user_id
      AND role_key = 'platform_super_admin'
      AND revoked_at IS NULL
  );
$$;

ALTER TABLE platform_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_super_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_audit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_roles'
      AND policyname = 'platform_roles_authorized_read'
  ) THEN
    CREATE POLICY platform_roles_authorized_read ON platform_roles
      FOR SELECT USING (boss_is_super_admin(boss_current_user_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_permissions'
      AND policyname = 'platform_permissions_authorized_read'
  ) THEN
    CREATE POLICY platform_permissions_authorized_read ON platform_permissions
      FOR SELECT USING (boss_is_super_admin(boss_current_user_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_role_permissions'
      AND policyname = 'platform_role_permissions_authorized_read'
  ) THEN
    CREATE POLICY platform_role_permissions_authorized_read ON platform_role_permissions
      FOR SELECT USING (boss_is_super_admin(boss_current_user_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_super_admins'
      AND policyname = 'platform_super_admins_authorized_read'
  ) THEN
    CREATE POLICY platform_super_admins_authorized_read ON platform_super_admins
      FOR SELECT USING (boss_is_super_admin(boss_current_user_id()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'platform_audit_events'
      AND policyname = 'platform_audit_events_authorized_read'
  ) THEN
    CREATE POLICY platform_audit_events_authorized_read ON platform_audit_events
      FOR SELECT USING (boss_is_super_admin(boss_current_user_id()));
  END IF;
END
$$;

REVOKE ALL ON platform_roles FROM anon, authenticated;
REVOKE ALL ON platform_permissions FROM anon, authenticated;
REVOKE ALL ON platform_role_permissions FROM anon, authenticated;
REVOKE ALL ON platform_super_admins FROM anon, authenticated;
REVOKE ALL ON platform_audit_events FROM anon, authenticated;

GRANT SELECT ON platform_roles TO authenticated;
GRANT SELECT ON platform_permissions TO authenticated;
GRANT SELECT ON platform_role_permissions TO authenticated;
GRANT SELECT ON platform_super_admins TO authenticated;
GRANT SELECT ON platform_audit_events TO authenticated;
