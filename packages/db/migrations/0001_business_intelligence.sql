-- Goal 2: Business Intelligence Layer schema.
-- Conventions per CLAUDE.md: uuid PK, created_at/updated_at, org_id tenancy,
-- soft delete via deleted_at, RLS-ready (org_id NOT NULL on every table).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  name text NOT NULL,
  industry text NOT NULL,
  employee_count integer NOT NULL DEFAULT 0,
  annual_revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  business_name text NOT NULL,
  business_type text NOT NULL,
  years_operating integer NOT NULL DEFAULT 0,
  employee_count integer NOT NULL DEFAULT 0,
  location_count integer NOT NULL DEFAULT 1,
  business_hours text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id)
);

CREATE TABLE business_mri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  version text NOT NULL DEFAULT '1.0.0',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE business_mri_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_mri_id uuid NOT NULL REFERENCES business_mri(id),
  section_key text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_mri_id, section_key)
);

-- Registry-driven question catalog mirrored into the DB for referential
-- integrity of responses; canonical definitions live in @boss/registries.
CREATE TABLE business_mri_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_key text NOT NULL UNIQUE,
  section_key text NOT NULL,
  label text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('text', 'number', 'boolean', 'single_select', 'multi_select', 'scale')),
  options jsonb,
  required boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE business_mri_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_mri_id uuid NOT NULL REFERENCES business_mri(id),
  section_key text NOT NULL,
  question_key text NOT NULL REFERENCES business_mri_questions(question_key),
  value jsonb NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_mri_id, question_key)
);

CREATE TABLE business_dna (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  archetype text NOT NULL,
  growth_stage text NOT NULL,
  operational_complexity text NOT NULL,
  technology_maturity text NOT NULL,
  automation_readiness text NOT NULL,
  customer_engagement_style text NOT NULL,
  revenue_model text NOT NULL,
  communication_style text NOT NULL,
  decision_style text NOT NULL,
  risk_profile text NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id)
);

CREATE TABLE business_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  overall_score numeric NOT NULL DEFAULT 0,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id)
);

CREATE TABLE business_health_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_health_id uuid NOT NULL REFERENCES business_health(id),
  dimension_key text NOT NULL,
  score numeric NOT NULL,
  confidence numeric NOT NULL,
  trend text NOT NULL CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')),
  evidence jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL CHECK (status IN ('strong', 'healthy', 'at_risk', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_health_id, dimension_key)
);

CREATE TABLE business_capabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  capability_key text NOT NULL,
  current_maturity text NOT NULL CHECK (current_maturity IN ('absent', 'ad_hoc', 'developing', 'managed', 'optimized')),
  business_importance text NOT NULL CHECK (business_importance IN ('low', 'medium', 'high', 'critical')),
  automation_potential text NOT NULL CHECK (automation_potential IN ('low', 'medium', 'high')),
  dependencies jsonb NOT NULL DEFAULT '[]',
  owner text NOT NULL DEFAULT 'unassigned',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id, capability_key)
);

CREATE TABLE business_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_business_profiles_business_id ON business_profiles(business_id);
CREATE INDEX idx_business_mri_business_id ON business_mri(business_id);
CREATE INDEX idx_business_mri_sections_mri_id ON business_mri_sections(business_mri_id);
CREATE INDEX idx_business_mri_responses_mri_id ON business_mri_responses(business_mri_id);
CREATE INDEX idx_business_dna_business_id ON business_dna(business_id);
CREATE INDEX idx_business_health_business_id ON business_health(business_id);
CREATE INDEX idx_business_health_dimensions_health_id ON business_health_dimensions(business_health_id);
CREATE INDEX idx_business_capabilities_business_id ON business_capabilities(business_id);
CREATE INDEX idx_business_timeline_business_id ON business_timeline(business_id);
CREATE INDEX idx_business_timeline_occurred_at ON business_timeline(occurred_at);
