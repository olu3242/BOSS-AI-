-- Migration 0039: Documents
-- Rollback: DROP TABLE IF EXISTS documents CASCADE;

CREATE TABLE IF NOT EXISTS documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL,
  business_id   uuid        NOT NULL,
  title         text        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  document_type text        NOT NULL
    CHECK (document_type IN ('contract','proposal','report','template','other')),
  status        text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','approved','signed','archived')),
  storage_path  text,
  mime_type     text,
  size_bytes    integer     CHECK (size_bytes IS NULL OR size_bytes >= 0),
  version       integer     NOT NULL DEFAULT 1 CHECK (version >= 1),
  tags          text[]      NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

CREATE INDEX IF NOT EXISTS idx_documents_org_business
  ON documents(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type
  ON documents(org_id, document_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_status
  ON documents(org_id, status) WHERE deleted_at IS NULL;

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY documents_tenant_policy ON documents
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
