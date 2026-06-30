-- Goal 22: Scenario Simulation Engine

CREATE TABLE business_scenarios (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid        NOT NULL,
  business_id         uuid        NOT NULL REFERENCES businesses(id),
  scenario_type       text        NOT NULL,
  objective           text        NOT NULL,
  assumptions         jsonb       NOT NULL DEFAULT '[]',
  affected_domains    jsonb       NOT NULL DEFAULT '[]',
  projected_revenue   numeric     NOT NULL DEFAULT 0,
  projected_cost      numeric     NOT NULL DEFAULT 0,
  projected_profit    numeric     NOT NULL DEFAULT 0,
  operational_impact  text        NOT NULL DEFAULT 'low',
  customer_impact     text        NOT NULL DEFAULT 'low',
  risk_level          text        NOT NULL DEFAULT 'low',
  confidence_score    numeric     NOT NULL DEFAULT 0,
  forecast_period     text        NOT NULL DEFAULT '90d',
  version             integer     NOT NULL DEFAULT 1,
  status              text        NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','calculated','approved','rejected','archived')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

CREATE INDEX idx_business_scenarios_business ON business_scenarios(org_id, business_id) WHERE deleted_at IS NULL;

CREATE TABLE scenario_comparisons (
  id                       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid        NOT NULL,
  business_id              uuid        NOT NULL REFERENCES businesses(id),
  scenario_ids             jsonb       NOT NULL DEFAULT '[]',
  recommended_scenario_id  text        NOT NULL,
  rationale                text        NOT NULL DEFAULT '',
  created_at               timestamptz NOT NULL DEFAULT now()
);
