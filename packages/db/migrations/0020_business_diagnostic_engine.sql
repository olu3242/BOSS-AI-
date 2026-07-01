-- Engine Program 03: canonical, tenant-scoped diagnostic outputs.

CREATE TABLE diagnostic_reports (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES businesses(id),
  business_mri_id uuid NOT NULL REFERENCES business_mri(id),
  weight_profile_id text NOT NULL,
  weight_profile_version text NOT NULL,
  overall_health numeric NOT NULL CHECK (overall_health BETWEEN 0 AND 100),
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  executive_summary jsonb NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'superseded')),
  generated_at timestamptz NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (business_id, version)
);

CREATE INDEX idx_diagnostic_reports_org_business
  ON diagnostic_reports(org_id, business_id, generated_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE diagnostic_area_scores (
  diagnostic_report_id uuid NOT NULL REFERENCES diagnostic_reports(id),
  org_id uuid NOT NULL,
  area text NOT NULL,
  current_score numeric NOT NULL CHECK (current_score BETWEEN 0 AND 100),
  desired_score numeric NOT NULL CHECK (desired_score BETWEEN 0 AND 100),
  gap numeric NOT NULL CHECK (gap BETWEEN 0 AND 100),
  trend text NOT NULL CHECK (trend IN ('improving', 'stable', 'declining', 'unknown')),
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  business_impact numeric NOT NULL CHECK (business_impact BETWEEN 0 AND 100),
  priority numeric NOT NULL CHECK (priority BETWEEN 0 AND 100),
  evidence jsonb NOT NULL,
  recommended_improvement text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (diagnostic_report_id, area)
);

CREATE TABLE diagnostic_root_causes (
  diagnostic_report_id uuid NOT NULL REFERENCES diagnostic_reports(id),
  org_id uuid NOT NULL,
  constraint_id uuid NOT NULL REFERENCES constraint_instances(id),
  area text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('primary', 'contributing', 'blocker', 'risk')),
  title text NOT NULL,
  description text NOT NULL,
  business_impact text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  dependencies jsonb NOT NULL,
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (diagnostic_report_id, constraint_id)
);

CREATE TABLE diagnostic_opportunities (
  diagnostic_report_id uuid NOT NULL REFERENCES diagnostic_reports(id),
  org_id uuid NOT NULL,
  recommendation_id uuid NOT NULL REFERENCES recommendation_instances(id),
  opportunity_type text NOT NULL CHECK (opportunity_type IN (
    'quick_win', 'high_impact', 'cost_reduction', 'revenue_growth',
    'automation_candidate', 'ai_delegation_candidate'
  )),
  title text NOT NULL,
  description text NOT NULL,
  expected_impact numeric NOT NULL CHECK (expected_impact BETWEEN 0 AND 100),
  effort numeric NOT NULL CHECK (effort BETWEEN 0 AND 100),
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  priority numeric NOT NULL CHECK (priority BETWEEN 0 AND 100),
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (diagnostic_report_id, recommendation_id)
);

CREATE TABLE diagnostic_maturity_assessments (
  diagnostic_report_id uuid NOT NULL REFERENCES diagnostic_reports(id),
  org_id uuid NOT NULL,
  area text NOT NULL,
  maturity_level integer NOT NULL CHECK (maturity_level BETWEEN 1 AND 5),
  score numeric NOT NULL CHECK (score BETWEEN 0 AND 100),
  rationale text NOT NULL,
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  evidence jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (diagnostic_report_id, area)
);

CREATE TABLE diagnostic_priority_items (
  diagnostic_report_id uuid NOT NULL REFERENCES diagnostic_reports(id),
  org_id uuid NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('root_cause', 'opportunity')),
  source_id uuid NOT NULL,
  impact numeric NOT NULL CHECK (impact BETWEEN 0 AND 100),
  urgency numeric NOT NULL CHECK (urgency BETWEEN 0 AND 100),
  effort numeric NOT NULL CHECK (effort BETWEEN 0 AND 100),
  confidence numeric NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  score numeric NOT NULL CHECK (score BETWEEN 0 AND 100),
  rank integer NOT NULL CHECK (rank > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (diagnostic_report_id, source_type, source_id),
  UNIQUE (diagnostic_report_id, rank)
);

CREATE INDEX idx_diagnostic_root_causes_report
  ON diagnostic_root_causes(diagnostic_report_id, kind);
CREATE INDEX idx_diagnostic_opportunities_report
  ON diagnostic_opportunities(diagnostic_report_id, priority DESC);
CREATE INDEX idx_diagnostic_priorities_report
  ON diagnostic_priority_items(diagnostic_report_id, rank);

ALTER TABLE diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_area_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_root_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_maturity_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_priority_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_reports_tenant_policy ON diagnostic_reports
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY diagnostic_area_scores_tenant_policy ON diagnostic_area_scores
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY diagnostic_root_causes_tenant_policy ON diagnostic_root_causes
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY diagnostic_opportunities_tenant_policy ON diagnostic_opportunities
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY diagnostic_maturity_tenant_policy ON diagnostic_maturity_assessments
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY diagnostic_priorities_tenant_policy ON diagnostic_priority_items
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
