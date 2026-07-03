CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL,
  customer_id uuid,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('draft','scheduled','in_progress','on_hold','completed','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to text,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  estimated_duration_minutes integer,
  actual_duration_minutes integer,
  location text,
  notes text,
  tags jsonb NOT NULL DEFAULT '[]',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_jobs_org_business ON jobs(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_status ON jobs(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_scheduled ON jobs(org_id, scheduled_at) WHERE deleted_at IS NULL AND scheduled_at IS NOT NULL;

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_tenant_policy ON jobs
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
