-- Migration 0043: Lifecycle Policies (policy-driven transition rules)
-- Rollback: DROP TABLE IF EXISTS lifecycle_policies CASCADE;

CREATE TABLE IF NOT EXISTS lifecycle_policies (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid        NOT NULL,
  business_id      uuid        NOT NULL,
  name             text        NOT NULL,
  from_event       text        NOT NULL,
  mode             text        NOT NULL DEFAULT 'automatic'
    CHECK (mode IN ('automatic','approval_required','manual')),
  action           jsonb       NOT NULL DEFAULT '{}',
  conditions       jsonb       NOT NULL DEFAULT '{}',
  approval_roles   text[]      NOT NULL DEFAULT '{}',
  priority         integer     NOT NULL DEFAULT 0,
  is_active        boolean     NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_policies_org_business
  ON lifecycle_policies(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lifecycle_policies_event
  ON lifecycle_policies(org_id, from_event) WHERE deleted_at IS NULL AND is_active = true;

ALTER TABLE lifecycle_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY lifecycle_policies_tenant_policy ON lifecycle_policies
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
