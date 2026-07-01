-- Goal 8: Business Tool & Integration Fabric schema.
-- Conventions per CLAUDE.md: uuid PK, created_at/updated_at, org_id tenancy,
-- soft delete via deleted_at, RLS-ready (org_id NOT NULL on every table).
-- Credentials are stored as references only -- never raw secrets.

CREATE TABLE capability_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE provider_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'email', 'sms', 'calendar', 'crm', 'accounting', 'storage', 'messaging', 'payments'
  )),
  supported_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  auth_type text NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'basic', 'none')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tool_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_key text NOT NULL UNIQUE,
  label text NOT NULL,
  capability_key text NOT NULL REFERENCES capability_contracts(capability_key),
  supported_provider_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  required_permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  retry_limit integer NOT NULL DEFAULT 0,
  timeout_ms integer NOT NULL DEFAULT 10000,
  rate_limit_per_minute integer NOT NULL DEFAULT 60,
  audit_level text NOT NULL CHECK (audit_level IN ('none', 'standard', 'sensitive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE integration_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  provider_key text NOT NULL REFERENCES provider_definitions(provider_key),
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  connected_at timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id, provider_key)
);

CREATE INDEX idx_integration_accounts_business ON integration_accounts(business_id);
CREATE INDEX idx_integration_accounts_org ON integration_accounts(org_id);

-- References only -- secret_ref points to an external secret store entry,
-- never the raw credential value itself.
CREATE TABLE credential_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  integration_account_id uuid NOT NULL REFERENCES integration_accounts(id),
  secret_ref text NOT NULL,
  rotated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_credential_references_account ON credential_references(integration_account_id);

CREATE TABLE permission_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  tool_key text NOT NULL REFERENCES tool_definitions(tool_key),
  role_key text NOT NULL,
  allowed boolean NOT NULL DEFAULT false,
  approval text NOT NULL CHECK (approval IN ('auto', 'approval_required', 'executive_review', 'manual_only')),
  rate_limit_per_minute integer,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id, tool_key, role_key)
);

CREATE INDEX idx_permission_policies_business ON permission_policies(business_id);

CREATE TABLE tool_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  tool_key text NOT NULL REFERENCES tool_definitions(tool_key),
  capability_key text NOT NULL REFERENCES capability_contracts(capability_key),
  provider_key text NOT NULL REFERENCES provider_definitions(provider_key),
  requested_by text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'rejected')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_tool_executions_business ON tool_executions(business_id);
CREATE INDEX idx_tool_executions_org ON tool_executions(org_id);

CREATE TABLE provider_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  provider_key text NOT NULL REFERENCES provider_definitions(provider_key),
  status text NOT NULL DEFAULT 'unknown' CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
  latency_ms numeric,
  failure_count integer NOT NULL DEFAULT 0,
  quota_remaining numeric,
  authenticated boolean NOT NULL DEFAULT false,
  checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_id, provider_key)
);

CREATE INDEX idx_provider_health_business ON provider_health(business_id);

CREATE TABLE tool_audit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  tool_execution_id uuid NOT NULL REFERENCES tool_executions(id),
  action text NOT NULL,
  actor text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_tool_audit_history_execution ON tool_audit_history(tool_execution_id);
CREATE INDEX idx_tool_audit_history_business ON tool_audit_history(business_id);
