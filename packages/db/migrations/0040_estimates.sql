-- Migration 0040: Estimates
-- Rollback: DROP TABLE IF EXISTS estimates CASCADE;

CREATE TABLE IF NOT EXISTS estimates (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid        NOT NULL,
  business_id          uuid        NOT NULL,
  customer_id          uuid,
  estimate_number      text        NOT NULL,
  status               text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','viewed','accepted','declined','expired','converted')),
  line_items           jsonb       NOT NULL DEFAULT '[]',
  subtotal_cents       integer     NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents            integer     NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  discount_cents       integer     NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents          integer     NOT NULL DEFAULT 0,
  currency             text        NOT NULL DEFAULT 'USD',
  valid_until          timestamptz,
  converted_invoice_id uuid,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_estimates_number
  ON estimates(org_id, estimate_number) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_org_business
  ON estimates(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_customer
  ON estimates(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_status
  ON estimates(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY estimates_tenant_policy ON estimates
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
