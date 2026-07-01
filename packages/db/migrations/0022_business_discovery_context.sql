-- OC2 Milestone 1: canonical, versioned, tenant-scoped Business Context.

CREATE TABLE business_discoveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  status text NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'in_progress', 'validated', 'published', 'archived')
  ),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  lock_version integer NOT NULL DEFAULT 1 CHECK (lock_version > 0),
  schema_version text NOT NULL DEFAULT '1.0.0',
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, business_id)
);

CREATE TABLE business_context_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  discovery_id uuid NOT NULL REFERENCES business_discoveries(id),
  version integer NOT NULL CHECK (version > 0),
  schema_version text NOT NULL,
  status_at_creation text NOT NULL CHECK (
    status_at_creation IN ('draft', 'in_progress', 'validated', 'published', 'archived')
  ),
  context jsonb NOT NULL CHECK (jsonb_typeof(context) = 'object'),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (discovery_id, version)
);

CREATE TABLE business_discovery_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  discovery_id uuid NOT NULL REFERENCES business_discoveries(id),
  discovery_version integer NOT NULL CHECK (discovery_version > 0),
  action text NOT NULL CHECK (action IN ('created', 'updated', 'transitioned')),
  previous_status text CHECK (
    previous_status IS NULL OR previous_status IN (
      'draft', 'in_progress', 'validated', 'published', 'archived'
    )
  ),
  new_status text NOT NULL CHECK (
    new_status IN ('draft', 'in_progress', 'validated', 'published', 'archived')
  ),
  actor_id text NOT NULL,
  reason text NOT NULL DEFAULT '',
  correlation_id text NOT NULL,
  trace_id text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_discoveries_tenant
  ON business_discoveries(org_id, business_id);
CREATE INDEX idx_business_context_versions_discovery
  ON business_context_versions(org_id, discovery_id, version DESC);
CREATE INDEX idx_business_discovery_history_discovery
  ON business_discovery_history(org_id, discovery_id, occurred_at DESC);

ALTER TABLE business_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_discovery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_discoveries_tenant_policy ON business_discoveries
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY business_context_versions_tenant_policy ON business_context_versions
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY business_discovery_history_tenant_policy ON business_discovery_history
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
