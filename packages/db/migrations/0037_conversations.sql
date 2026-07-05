-- Migration 0037: Conversations
-- Rollback: DROP TABLE IF EXISTS conversations CASCADE;

CREATE TABLE IF NOT EXISTS conversations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid        NOT NULL,
  business_id  uuid        NOT NULL,
  customer_id  uuid,
  channel      text        NOT NULL
    CHECK (channel IN ('email','sms','phone','chat','in_person','other')),
  direction    text        NOT NULL
    CHECK (direction IN ('inbound','outbound')),
  subject      text,
  body         text        NOT NULL CHECK (char_length(body) >= 1),
  status       text        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','resolved','archived')),
  assigned_to  text,
  sentiment    text
    CHECK (sentiment IS NULL OR sentiment IN ('positive','neutral','negative')),
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

CREATE INDEX IF NOT EXISTS idx_conversations_org_business
  ON conversations(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_customer
  ON conversations(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_occurred
  ON conversations(org_id, occurred_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_tenant_policy ON conversations
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
