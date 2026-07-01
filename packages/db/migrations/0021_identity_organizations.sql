-- OC1 Wave A: durable organizations, memberships, and active tenant state.

CREATE OR REPLACE FUNCTION boss_current_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_user_id', true), ''),
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  );
$$;

CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'trial',
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'trial', 'suspended')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE organization_memberships (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'operator', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

CREATE INDEX idx_organization_memberships_user
  ON organization_memberships(user_id, status);

CREATE TABLE user_tenant_preferences (
  user_id text PRIMARY KEY,
  active_organization_id uuid REFERENCES organizations(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE identity_audit_events (
  id uuid PRIMARY KEY,
  tenant_id text NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  actor_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  trace_id text NOT NULL,
  request_id text,
  correlation_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL
);

CREATE INDEX idx_identity_audit_tenant_time
  ON identity_audit_events(tenant_id, occurred_at DESC);

CREATE INDEX idx_identity_audit_actor_time
  ON identity_audit_events(actor_id, occurred_at DESC);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenant_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_member_select ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM organization_memberships membership
      WHERE membership.organization_id = organizations.id
        AND membership.user_id = boss_current_user_id()
        AND membership.status = 'active'
    )
  );

CREATE POLICY memberships_self_select ON organization_memberships
  FOR SELECT
  USING (user_id = boss_current_user_id());

CREATE POLICY tenant_preferences_self_policy ON user_tenant_preferences
  USING (user_id = boss_current_user_id())
  WITH CHECK (
    user_id = boss_current_user_id()
    AND (
      active_organization_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM organization_memberships membership
        WHERE membership.organization_id =
          user_tenant_preferences.active_organization_id
          AND membership.user_id = boss_current_user_id()
          AND membership.status = 'active'
      )
    )
  );

CREATE POLICY identity_audit_member_select ON identity_audit_events
  FOR SELECT
  USING (
    actor_id = boss_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM organization_memberships membership
        WHERE membership.organization_id = identity_audit_events.organization_id
          AND membership.user_id = boss_current_user_id()
          AND membership.status = 'active'
      )
    )
  );
