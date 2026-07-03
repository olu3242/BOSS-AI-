CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL,
  customer_id uuid,
  job_id uuid,
  title text NOT NULL,
  notes text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled','no_show')),
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  location text,
  assigned_to text,
  reminder_sent boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_appointments_org_business ON appointments(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_start ON appointments(org_id, start_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_customer ON appointments(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointments_tenant_policy ON appointments
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
