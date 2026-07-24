-- Migration 0048: Add onboarding-collected fields to business_profiles
-- Persists services offered, existing tool stack, and selected AI agents captured
-- during the 7-step onboarding wizard.

ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS services       TEXT,
  ADD COLUMN IF NOT EXISTS existing_tools TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_agents      TEXT[]  NOT NULL DEFAULT '{}';

COMMENT ON COLUMN business_profiles.services       IS 'Free-text services/products list from onboarding wizard';
COMMENT ON COLUMN business_profiles.existing_tools IS 'Tool names selected in onboarding wizard (Step 5)';
COMMENT ON COLUMN business_profiles.ai_agents      IS 'AI agent keys activated in onboarding wizard (Step 6)';
