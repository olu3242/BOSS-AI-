-- Loop Runtime schema (EP-1 Batch 5 prerequisite).
-- Conventions per CLAUDE.md: uuid PK, created_at/updated_at, org_id tenancy,
-- soft delete via deleted_at on mutable state tables; append-only event log
-- has no deleted_at.

CREATE TABLE workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  workflow_key text NOT NULL,
  state text NOT NULL CHECK (state IN (
    'pending', 'queued', 'running', 'waiting', 'approved', 'rejected',
    'completed', 'failed', 'cancelled', 'rolled_back', 'timed_out'
  )),
  current_step_index integer NOT NULL DEFAULT 0,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_workflow_executions_business ON workflow_executions(business_id);
CREATE INDEX idx_workflow_executions_org ON workflow_executions(org_id);

CREATE TABLE task_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  workflow_execution_id uuid NOT NULL REFERENCES workflow_executions(id),
  step_key text NOT NULL,
  task_type text NOT NULL CHECK (task_type IN ('ai', 'manual', 'scheduled', 'tool')),
  state text NOT NULL CHECK (state IN (
    'pending', 'queued', 'running', 'waiting', 'approved', 'rejected',
    'completed', 'failed', 'cancelled', 'rolled_back', 'timed_out'
  )),
  attempt integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 0,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_task_executions_workflow ON task_executions(workflow_execution_id);
CREATE INDEX idx_task_executions_business ON task_executions(business_id);

CREATE TABLE execution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  workflow_execution_id uuid NOT NULL REFERENCES workflow_executions(id),
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_execution_events_workflow ON execution_events(workflow_execution_id);
CREATE INDEX idx_execution_events_business ON execution_events(business_id);

CREATE TABLE dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  workflow_execution_id uuid NOT NULL REFERENCES workflow_executions(id),
  task_execution_id uuid NOT NULL REFERENCES task_executions(id),
  step_key text NOT NULL,
  reason text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_dead_letter_queue_business ON dead_letter_queue(business_id);
CREATE INDEX idx_dead_letter_queue_workflow ON dead_letter_queue(workflow_execution_id);
