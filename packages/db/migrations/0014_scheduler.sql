-- Enterprise Scheduler schema (Goal 17).
-- Provides durable job scheduling for the Loop Runtime:
-- immediate, delayed, recurring (cron), and one-shot trigger types.

CREATE TABLE scheduler_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL,
  business_id     uuid NOT NULL REFERENCES businesses(id),
  workflow_key    text NOT NULL,
  trigger_type    text NOT NULL CHECK (trigger_type IN ('immediate', 'delayed', 'cron', 'recurring')),
  cron_expression text,                -- set for cron/recurring
  timezone        text NOT NULL DEFAULT 'UTC',
  run_at          timestamptz NOT NULL, -- next (or only) scheduled fire time
  state           text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  last_run_at     timestamptz,
  next_run_at     timestamptz,         -- updated after each cron/recurring run
  run_count       integer NOT NULL DEFAULT 0,
  max_runs        integer,             -- null = unlimited for cron; 1 for one-shot
  payload         jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX idx_scheduler_jobs_org      ON scheduler_jobs(org_id);
CREATE INDEX idx_scheduler_jobs_business ON scheduler_jobs(business_id);
CREATE INDEX idx_scheduler_jobs_pending  ON scheduler_jobs(state, run_at) WHERE state = 'pending' AND deleted_at IS NULL;
