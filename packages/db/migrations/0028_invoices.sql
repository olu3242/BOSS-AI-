CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  job_id uuid,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','paid','overdue','cancelled','refunded')),
  line_items jsonb NOT NULL DEFAULT '[]',
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  discount_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  due_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  payment_method text,
  notes text,
  terms text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX uq_invoices_number ON invoices(org_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_org_business ON invoices(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_customer ON invoices(org_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoices_tenant_policy ON invoices
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
