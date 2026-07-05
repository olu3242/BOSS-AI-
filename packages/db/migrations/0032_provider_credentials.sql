-- Migration 0032: provider_credentials
-- AES-256-GCM encrypted credential storage for production secret vault.
-- Replaces encryptedInMemorySecretStore for production deployments.

CREATE TABLE IF NOT EXISTS provider_credentials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  secret_key  text NOT NULL,
  ciphertext  text NOT NULL,
  iv          text NOT NULL,
  auth_tag    text NOT NULL,
  provider_key text,
  rotated_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  UNIQUE (org_id, secret_key)
);

CREATE TABLE IF NOT EXISTS provider_credential_audit (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL,
  secret_key  text NOT NULL,
  action      text NOT NULL CHECK (action IN ('get','put','rotate','delete')),
  actor       text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_credentials_org_key ON provider_credentials(org_id, secret_key);
CREATE INDEX IF NOT EXISTS idx_provider_credential_audit_org_key ON provider_credential_audit(org_id, secret_key);
