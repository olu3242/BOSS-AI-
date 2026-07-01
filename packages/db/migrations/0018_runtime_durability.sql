-- RCIP Program A: durable, tenant-scoped runtime state.
-- Runtime workers use leases so abandoned work can be recovered by another instance.

CREATE OR REPLACE FUNCTION boss_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_org_id', true), '')::uuid,
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'org_id')::uuid
  );
$$;

CREATE TABLE runtime_workers (
  id text PRIMARY KEY,
  instance_id text NOT NULL,
  status text NOT NULL CHECK (status IN ('starting', 'ready', 'draining', 'stopped', 'unhealthy')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  heartbeat_at timestamptz NOT NULL DEFAULT now(),
  stopped_at timestamptz
);

CREATE INDEX idx_runtime_workers_heartbeat ON runtime_workers(heartbeat_at);

CREATE TABLE workflow_executions (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  definition_id text NOT NULL,
  business_id text NOT NULL,
  context jsonb NOT NULL,
  state text NOT NULL CHECK (state IN (
    'pending', 'running', 'awaiting_approval', 'compensating',
    'completed', 'compensated', 'failed'
  )),
  current_step_id text,
  completed_step_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  error text,
  started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  completed_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_workflow_executions_org_updated
  ON workflow_executions(org_id, updated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE runtime_jobs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  queue_name text NOT NULL,
  payload jsonb NOT NULL,
  context jsonb NOT NULL,
  idempotency_key text,
  state text NOT NULL DEFAULT 'pending' CHECK (state IN (
    'pending', 'running', 'completed', 'dead_letter'
  )),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  maximum_attempts integer NOT NULL DEFAULT 3 CHECK (maximum_attempts > 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

CREATE UNIQUE INDEX uq_runtime_jobs_idempotency
  ON runtime_jobs(org_id, queue_name, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_runtime_jobs_claim
  ON runtime_jobs(queue_name, state, available_at, lease_expires_at)
  WHERE deleted_at IS NULL;

CREATE TABLE runtime_schedules (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  queue_name text NOT NULL,
  payload jsonb NOT NULL,
  context jsonb NOT NULL,
  idempotency_key text,
  run_at timestamptz NOT NULL,
  recurrence_ms integer CHECK (recurrence_ms IS NULL OR recurrence_ms > 0),
  maximum_attempts integer NOT NULL DEFAULT 3 CHECK (maximum_attempts > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  lease_owner text,
  lease_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_runtime_schedules_due
  ON runtime_schedules(status, run_at, lease_expires_at)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_runtime_schedules_idempotency
  ON runtime_schedules(org_id, queue_name, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;

CREATE TABLE runtime_events (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  context jsonb NOT NULL,
  correlation_id text NOT NULL,
  trace_id text NOT NULL,
  published_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_runtime_events_org_published
  ON runtime_events(org_id, published_at DESC);
CREATE INDEX idx_runtime_events_correlation
  ON runtime_events(correlation_id);

CREATE TABLE agent_executions (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  agent_id text NOT NULL,
  context jsonb NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'running', 'completed', 'failed')),
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error text,
  started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  completed_at timestamptz
);

CREATE INDEX idx_agent_executions_org_updated
  ON agent_executions(org_id, updated_at DESC);

CREATE TABLE runtime_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  execution_type text NOT NULL CHECK (execution_type IN ('workflow', 'agent', 'automation')),
  execution_id uuid NOT NULL,
  checkpoint_key text NOT NULL,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, execution_type, execution_id, checkpoint_key)
);

CREATE INDEX idx_runtime_checkpoints_execution
  ON runtime_checkpoints(org_id, execution_type, execution_id);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_executions_tenant_policy ON workflow_executions
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_jobs_tenant_policy ON runtime_jobs
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_schedules_tenant_policy ON runtime_schedules
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_events_tenant_policy ON runtime_events
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY agent_executions_tenant_policy ON agent_executions
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_checkpoints_tenant_policy ON runtime_checkpoints
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
