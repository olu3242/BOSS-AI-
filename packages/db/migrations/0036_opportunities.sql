-- Migration 0036: Opportunities
-- Rollback: DROP TABLE IF EXISTS opportunities CASCADE;

CREATE TABLE IF NOT EXISTS opportunities (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid        NOT NULL,
  business_id          uuid        NOT NULL,
  customer_id          uuid,
  lead_id              uuid,
  title                text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  stage                text        NOT NULL DEFAULT 'prospecting'
    CHECK (stage IN ('prospecting','qualification','proposal','negotiation','closed_won','closed_lost')),
  value_cents          integer     NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  currency             text        NOT NULL DEFAULT 'USD',
  probability          integer     NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date  date,
  assigned_to          text,
  source               text,
  notes                text,
  tags                 text[]      NOT NULL DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz
);

CREATE INDEX IF NOT EXISTS idx_opportunities_org_business
  ON opportunities(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_stage
  ON opportunities(org_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_customer
  ON opportunities(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_lead
  ON opportunities(org_id, lead_id) WHERE deleted_at IS NULL AND lead_id IS NOT NULL;

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY opportunities_tenant_policy ON opportunities
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
