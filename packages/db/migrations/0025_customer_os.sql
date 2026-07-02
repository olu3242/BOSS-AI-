-- RC2.1 Customer OS — Capability 1
-- Tables: customers, customer_interactions

CREATE TABLE customers (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL,
  business_id      uuid NOT NULL REFERENCES businesses(id),
  first_name       text NOT NULL,
  last_name        text NOT NULL DEFAULT '',
  email            text,
  phone            text,
  address          text,
  status           text NOT NULL DEFAULT 'prospect',
  source           text,
  tags             text[] NOT NULL DEFAULT '{}',
  notes            text,
  total_revenue    numeric(14,2) NOT NULL DEFAULT 0,
  health_score     numeric(5,2),
  last_contact_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE INDEX idx_customers_org_business ON customers (org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_org_status   ON customers (org_id, status)      WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email        ON customers (org_id, email)        WHERE deleted_at IS NULL AND email IS NOT NULL;

CREATE TABLE customer_interactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL,
  business_id  uuid NOT NULL REFERENCES businesses(id),
  customer_id  uuid NOT NULL REFERENCES customers(id),
  type         text NOT NULL,
  summary      text NOT NULL DEFAULT '',
  metadata     jsonb NOT NULL DEFAULT '{}',
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX idx_customer_interactions_customer ON customer_interactions (org_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_interactions_business ON customer_interactions (org_id, business_id) WHERE deleted_at IS NULL;
