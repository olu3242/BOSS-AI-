-- Product instrumentation for Time to First Business Value (TTFBV).
-- Pre-organization events are server-written and have a null org_id.

CREATE TABLE mvp_journey_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id uuid NOT NULL,
  org_id uuid,
  actor_id text,
  business_id uuid,
  trace_id text NOT NULL,
  stage text NOT NULL CHECK (stage IN (
    'landing_viewed',
    'signup_completed',
    'organization_created',
    'business_profile_completed',
    'diagnostic_completed',
    'health_score_viewed',
    'problems_viewed',
    'plan_generated',
    'plan_approved',
    'workflow_created',
    'agent_executed',
    'automation_completed',
    'first_value_visible'
  )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (journey_id, stage)
);

CREATE INDEX idx_mvp_journey_events_journey
  ON mvp_journey_events(journey_id, occurred_at);
CREATE INDEX idx_mvp_journey_events_org
  ON mvp_journey_events(org_id, occurred_at DESC)
  WHERE org_id IS NOT NULL;

ALTER TABLE mvp_journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY mvp_journey_events_tenant_policy ON mvp_journey_events
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
