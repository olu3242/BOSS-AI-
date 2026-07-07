-- Migration 0033: feature_flags
-- DB-backed feature flags with env-var fallback for dynamic runtime toggling.

CREATE TABLE IF NOT EXISTS feature_flags (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid,                       -- null = global flag
  flag_key    text NOT NULL,
  enabled     boolean NOT NULL DEFAULT false,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  UNIQUE (org_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feature_flags_org_key ON feature_flags(org_id, flag_key) WHERE deleted_at IS NULL;
