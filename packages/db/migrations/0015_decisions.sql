-- Goal 21: Business Decision Intelligence

CREATE TABLE business_decisions (
  id                             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                         uuid        NOT NULL,
  business_id                    uuid        NOT NULL REFERENCES businesses(id),
  decision_type                  text        NOT NULL,
  objective                      text        NOT NULL,
  context                        text        NOT NULL DEFAULT '',
  supporting_recommendation_ids  jsonb       NOT NULL DEFAULT '[]',
  supporting_constraint_ids      jsonb       NOT NULL DEFAULT '[]',
  applied_policy_keys            jsonb       NOT NULL DEFAULT '[]',
  options                        jsonb       NOT NULL DEFAULT '[]',
  selected_option_key            text,
  expected_impact                jsonb       NOT NULL DEFAULT '{}',
  expected_roi                   numeric     NOT NULL DEFAULT 0,
  expected_cost                  numeric     NOT NULL DEFAULT 0,
  confidence_score               numeric     NOT NULL DEFAULT 0,
  status                         text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','generated','reviewed','approved','rejected','scheduled','executing','completed','measured','archived')),
  approved_at                    timestamptz,
  rejected_at                    timestamptz,
  completed_at                   timestamptz,
  measured_at                    timestamptz,
  actual_roi                     numeric,
  lessons_learned                text,
  executive_summary              text,
  generated_workflow_id          text,
  created_at                     timestamptz NOT NULL DEFAULT now(),
  updated_at                     timestamptz NOT NULL DEFAULT now(),
  deleted_at                     timestamptz
);

CREATE INDEX idx_business_decisions_business ON business_decisions(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_business_decisions_status   ON business_decisions(status)              WHERE deleted_at IS NULL;
