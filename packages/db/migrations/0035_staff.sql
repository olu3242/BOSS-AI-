-- Migration 0035: Staff
-- Rollback: DROP TABLE IF EXISTS staff CASCADE;

CREATE TABLE IF NOT EXISTS staff (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL,
  business_id uuid        NOT NULL,
  user_id     text        NOT NULL,
  first_name  text        NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 100),
  last_name   text        NOT NULL DEFAULT '' CHECK (char_length(last_name) <= 100),
  email       text,
  phone       text,
  role        text        NOT NULL CHECK (char_length(role) BETWEEN 1 AND 100),
  department  text,
  status      text        NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'on_leave')),
  hire_date   date,
  tags        text[]      NOT NULL DEFAULT '{}',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_staff_org_business
  ON staff(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_user_id
  ON staff(org_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_status
  ON staff(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY staff_tenant_policy ON staff
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
