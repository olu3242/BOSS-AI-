-- Goal 4: Recommendation Intelligence Engine schema.
-- Conventions per CLAUDE.md: uuid PK, created_at/updated_at, org_id tenancy,
-- soft delete via deleted_at, RLS-ready (org_id NOT NULL on every table).

CREATE TABLE recommendation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL UNIQUE,
  label text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recommendation_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  definition_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  business_goal text NOT NULL,
  category_key text NOT NULL REFERENCES recommendation_categories(category_key),
  difficulty text NOT NULL CHECK (difficulty IN ('low', 'medium', 'high')),
  automation_potential text NOT NULL CHECK (automation_potential IN ('low', 'medium', 'high')),
  approval text NOT NULL CHECK (approval IN ('auto', 'approval_required', 'executive_review', 'manual_only')),
  stage text NOT NULL CHECK (stage IN ('quick_wins', 'short_term', 'medium_term', 'strategic', 'long_term')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE recommendation_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  definition_key text NOT NULL REFERENCES recommendation_definitions(definition_key),
  title text NOT NULL,
  description text NOT NULL,
  business_goal text NOT NULL,
  category_key text NOT NULL REFERENCES recommendation_categories(category_key),
  expected_outcome text NOT NULL DEFAULT '',
  difficulty text NOT NULL CHECK (difficulty IN ('low', 'medium', 'high')),
  estimated_effort_hours numeric NOT NULL DEFAULT 0,
  estimated_cost numeric NOT NULL DEFAULT 0,
  estimated_time_to_value_days numeric NOT NULL DEFAULT 0,
  confidence numeric NOT NULL DEFAULT 0,
  related_capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_kpi_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  dependencies jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval text NOT NULL CHECK (approval IN ('auto', 'approval_required', 'executive_review', 'manual_only')),
  stage text NOT NULL CHECK (stage IN ('quick_wins', 'short_term', 'medium_term', 'strategic', 'long_term')),
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'in_progress', 'completed', 'dismissed')),
  date_recommended timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_recommendation_instances_business ON recommendation_instances(business_id);
CREATE INDEX idx_recommendation_instances_org ON recommendation_instances(org_id);

CREATE TABLE recommendation_constraint_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recommendation_instance_id uuid NOT NULL REFERENCES recommendation_instances(id),
  constraint_instance_id uuid NOT NULL REFERENCES constraint_instances(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendation_constraint_links_recommendation ON recommendation_constraint_links(recommendation_instance_id);

CREATE TABLE recommendation_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recommendation_instance_id uuid NOT NULL REFERENCES recommendation_instances(id),
  source text NOT NULL CHECK (source IN (
    'constraint_analysis', 'business_health', 'capability_assessment', 'business_mri', 'configuration'
  )),
  description text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendation_evidence_instance ON recommendation_evidence(recommendation_instance_id);

CREATE TABLE recommendation_roi_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recommendation_instance_id uuid NOT NULL REFERENCES recommendation_instances(id),
  revenue_increase_annual numeric NOT NULL DEFAULT 0,
  time_saved_hours_weekly numeric NOT NULL DEFAULT 0,
  administrative_reduction_hours numeric NOT NULL DEFAULT 0,
  customer_retention_increase_pct numeric NOT NULL DEFAULT 0,
  lead_conversion_improvement_pct numeric NOT NULL DEFAULT 0,
  profit_impact_annual numeric NOT NULL DEFAULT 0,
  owner_time_saved_hours_weekly numeric NOT NULL DEFAULT 0,
  risk_reduction text NOT NULL CHECK (risk_reduction IN ('low', 'medium', 'high')),
  confidence numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recommendation_instance_id)
);

CREATE TABLE recommendation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recommendation_instance_id uuid NOT NULL REFERENCES recommendation_instances(id),
  priority_score numeric NOT NULL,
  business_value_score numeric NOT NULL,
  implementation_score numeric NOT NULL,
  strategic_score numeric NOT NULL,
  overall_score numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recommendation_instance_id)
);

CREATE TABLE recommendation_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recommendation_instance_id uuid NOT NULL REFERENCES recommendation_instances(id),
  priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low', 'informational')),
  rank integer NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recommendation_instance_id)
);

CREATE TABLE transformation_roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  generated_at timestamptz NOT NULL DEFAULT now(),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transformation_roadmaps_business ON transformation_roadmaps(business_id);

CREATE TABLE transformation_roadmap_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  transformation_roadmap_id uuid NOT NULL REFERENCES transformation_roadmaps(id),
  stage text NOT NULL CHECK (stage IN ('quick_wins', 'short_term', 'medium_term', 'strategic', 'long_term')),
  recommendation_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_transformation_roadmap_stages_roadmap ON transformation_roadmap_stages(transformation_roadmap_id);

CREATE TABLE recommendation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL,
  recommendation_instance_id uuid NOT NULL REFERENCES recommendation_instances(id),
  previous_status text,
  new_status text NOT NULL,
  note text NOT NULL DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recommendation_history_instance ON recommendation_history(recommendation_instance_id);
