-- AI Employee runtime memory store (EP-1 Batch 6).
-- Conventions per CLAUDE.md: uuid PK, created_at/updated_at, org_id tenancy.
-- No deleted_at: memory rows are upserted in place and expire via expires_at.

CREATE TABLE memory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  owner_type text NOT NULL CHECK (owner_type IN ('agent', 'business')),
  owner_id text NOT NULL,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, business_id, owner_type, owner_id, key)
);

CREATE INDEX idx_memory_records_owner ON memory_records(org_id, business_id, owner_type, owner_id);
