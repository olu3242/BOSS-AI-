-- Migration 0034: leads
-- Lead capture and qualification pipeline for Sales OS.
-- Events: lead.created, lead.qualified, lead.assigned, lead.converted

CREATE TABLE IF NOT EXISTS leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL,
  business_id   uuid NOT NULL,
  first_name    text NOT NULL,
  last_name     text NOT NULL DEFAULT '',
  email         text,
  phone         text,
  source        text NOT NULL DEFAULT 'manual',
  status        text NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','contacted','qualified','converted','lost')),
  assigned_to   text,
  notes         text,
  tags          text[] NOT NULL DEFAULT '{}',
  estimated_value numeric(12,2),
  converted_customer_id uuid,
  qualified_at  timestamptz,
  converted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_leads_org_business ON leads(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(org_id, status) WHERE deleted_at IS NULL;
