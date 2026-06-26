-- Goal 3: Constraint Intelligence Engine schema.
-- Conventions per CLAUDE.md: uuid PK, created_at/updated_at, org_id tenancy,
-- soft delete via deleted_at, RLS-ready (org_id NOT NULL on every table).

CREATE TABLE constraint_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE constraint_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  category_key text NOT NULL REFERENCES constraint_categories(category_key),
  default_severity text NOT NULL CHECK (default_severity IN ('critical', 'high', 'medium', 'low', 'informational')),
  automation_potential text NOT NULL CHECK (automation_potential IN ('low', 'medium', 'high')),
  business_owner text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE constraint_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  definition_key text NOT NULL REFERENCES constraint_definitions(definition_key),
  title text NOT NULL,
  description text NOT NULL,
  category_key text NOT NULL REFERENCES constraint_categories(category_key),
  severity text NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'informational')),
  confidence numeric NOT NULL DEFAULT 0,
  business_impact text NOT NULL DEFAULT '',
  revenue_loss_annual numeric NOT NULL DEFAULT 0,
  time_lost_hours_weekly numeric NOT NULL DEFAULT 0,
  customer_impact text NOT NULL CHECK (customer_impact IN ('low', 'medium', 'high')),
  operational_impact text NOT NULL CHECK (operational_impact IN ('low', 'medium', 'high')),
  growth_limitation text NOT NULL DEFAULT 'low' CHECK (growth_limitation IN ('low', 'medium', 'high')),
  owner_stress text NOT NULL DEFAULT 'low' CHECK (owner_stress IN ('low', 'medium', 'high')),
  automation_potential text NOT NULL CHECK (automation_potential IN ('low', 'medium', 'high')),
  business_owner text NOT NULL,
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'resolved', 'dismissed')),
  date_detected timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_constraint_instances_business ON constraint_instances(business_id);
CREATE INDEX idx_constraint_instances_org ON constraint_instances(org_id);

CREATE TABLE constraint_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  constraint_instance_id uuid NOT NULL REFERENCES constraint_instances(id),
  source text NOT NULL CHECK (source IN (
    'business_mri', 'business_health', 'capability_assessment',
    'business_timeline', 'business_profile', 'configuration', 'historical_assessment'
  )),
  description text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_constraint_evidence_instance ON constraint_evidence(constraint_instance_id);

CREATE TABLE constraint_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  constraint_instance_id uuid NOT NULL REFERENCES constraint_instances(id),
  related_type text NOT NULL CHECK (related_type IN ('capability', 'kpi', 'health_dimension', 'constraint')),
  related_key text NOT NULL,
  relationship text NOT NULL DEFAULT 'depends_on',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_constraint_relationships_instance ON constraint_relationships(constraint_instance_id);

CREATE TABLE constraint_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  constraint_instance_id uuid NOT NULL REFERENCES constraint_instances(id),
  business_impact_score numeric NOT NULL,
  financial_impact_score numeric NOT NULL,
  customer_impact_score numeric NOT NULL,
  urgency_score numeric NOT NULL,
  automation_score numeric NOT NULL,
  confidence_score numeric NOT NULL,
  overall_score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (constraint_instance_id)
);

CREATE TABLE constraint_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  constraint_instance_id uuid NOT NULL REFERENCES constraint_instances(id),
  priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low', 'informational')),
  rank integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (constraint_instance_id)
);

CREATE TABLE constraint_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  constraint_instance_id uuid NOT NULL REFERENCES constraint_instances(id),
  previous_status text,
  new_status text NOT NULL,
  note text NOT NULL DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_constraint_history_instance ON constraint_history(constraint_instance_id);
