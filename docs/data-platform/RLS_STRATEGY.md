# BOSS Row-Level Security Strategy

> Version: 1.0.0 | Production-ready SQL policies

---

## Foundation Functions

```sql
-- Read current org from JWT claims or session setting
CREATE OR REPLACE FUNCTION boss_current_org_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_org_id', true), '')::uuid,
    (NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'org_id')::uuid
  );
$$;

-- Read current user from JWT claims or session setting
CREATE OR REPLACE FUNCTION boss_current_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_user_id', true), ''),
    NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  );
$$;
```

Both functions are used by all RLS policies. They read from Supabase's JWT claims with a fallback to explicitly set session variables for server-side worker processes.

---

## Tenant Isolation Policy Template

Apply this policy to every tenant-scoped table:

```sql
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Allow all operations only for the current tenant
CREATE POLICY <table_name>_tenant_policy ON <table_name>
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
```

---

## Currently Enabled Policies (as of migration 0034)

### Runtime Tables (Migration 0018)

```sql
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE runtime_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_executions_tenant_policy ON workflow_executions
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_jobs_tenant_policy ON runtime_jobs
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_schedules_tenant_policy ON runtime_schedules
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_events_tenant_policy ON runtime_events
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY agent_executions_tenant_policy ON agent_executions
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
CREATE POLICY runtime_checkpoints_tenant_policy ON runtime_checkpoints
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
```

### Diagnostic Tables (Migration 0020)

```sql
ALTER TABLE diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_area_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_root_causes ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_maturity_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_priority_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnostic_reports_tenant_policy ON diagnostic_reports
  USING (org_id = boss_current_org_id()) WITH CHECK (org_id = boss_current_org_id());
-- (same pattern for all diagnostic tables)
```

### Discovery & Graph Tables (Migrations 0022–0023)

```sql
ALTER TABLE business_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_context_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_discovery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_graph_history ENABLE ROW LEVEL SECURITY;

-- All use the standard tenant policy pattern
```

### Operational Tables (Migrations 0026–0030)

```sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
```

### Identity Tables (Migration 0021)

```sql
-- Organizations: select only if user is active member
CREATE POLICY organizations_member_select ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_memberships m
      WHERE m.organization_id = organizations.id
        AND m.user_id = boss_current_user_id()
        AND m.status = 'active'
    )
  );

-- Memberships: self-select only
CREATE POLICY memberships_self_select ON organization_memberships FOR SELECT
  USING (user_id = boss_current_user_id());

-- Tenant preferences: full self-policy with org validation
CREATE POLICY tenant_preferences_self_policy ON user_tenant_preferences
  USING (user_id = boss_current_user_id())
  WITH CHECK (
    user_id = boss_current_user_id()
    AND (
      active_organization_id IS NULL
      OR EXISTS (
        SELECT 1 FROM organization_memberships m
        WHERE m.organization_id = user_tenant_preferences.active_organization_id
          AND m.user_id = boss_current_user_id()
          AND m.status = 'active'
      )
    )
  );

-- Audit events: own events or org-member events
CREATE POLICY identity_audit_member_select ON identity_audit_events FOR SELECT
  USING (
    actor_id = boss_current_user_id()
    OR (
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM organization_memberships m
        WHERE m.organization_id = identity_audit_events.organization_id
          AND m.user_id = boss_current_user_id()
          AND m.status = 'active'
      )
    )
  );
```

---

## Migration 0035 — RLS Rollout for Remaining Tables

The following migration should be applied to complete RLS coverage:

```sql
-- Business Intelligence tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY businesses_tenant ON businesses
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_profiles_tenant ON business_profiles
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_mri ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_mri_tenant ON business_mri
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_mri_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_mri_sections_tenant ON business_mri_sections
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_mri_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_mri_responses_tenant ON business_mri_responses
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_dna ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_dna_tenant ON business_dna
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_health_tenant ON business_health
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_health_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_health_dimensions_tenant ON business_health_dimensions
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_capabilities_tenant ON business_capabilities
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_timeline_tenant ON business_timeline
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Constraint tables
ALTER TABLE constraint_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY constraint_instances_tenant ON constraint_instances
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE constraint_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY constraint_scores_tenant ON constraint_scores
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE constraint_priorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY constraint_priorities_tenant ON constraint_priorities
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE constraint_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY constraint_evidence_tenant ON constraint_evidence
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE constraint_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY constraint_relationships_tenant ON constraint_relationships
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE constraint_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY constraint_history_tenant ON constraint_history
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Recommendation tables
ALTER TABLE recommendation_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_instances_tenant ON recommendation_instances
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE recommendation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_scores_tenant ON recommendation_scores
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE recommendation_priorities ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_priorities_tenant ON recommendation_priorities
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE recommendation_roi_estimates ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_roi_tenant ON recommendation_roi_estimates
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE transformation_roadmaps ENABLE ROW LEVEL SECURITY;
CREATE POLICY transformation_roadmaps_tenant ON transformation_roadmaps
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Integration & Tool
ALTER TABLE integration_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY integration_accounts_tenant ON integration_accounts
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE permission_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY permission_policies_tenant ON permission_policies
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tool_executions_tenant ON tool_executions
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE provider_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_evidence_tenant ON provider_evidence
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE provider_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_credentials_tenant ON provider_credentials
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE provider_credential_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY provider_credential_audit_tenant ON provider_credential_audit
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- CRM & Sales
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY customers_tenant ON customers
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE customer_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY customer_interactions_tenant ON customer_interactions
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_tenant ON leads
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- AI Workforce
ALTER TABLE memory_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY memory_records_tenant ON memory_records
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Scheduler
ALTER TABLE scheduler_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY scheduler_jobs_tenant ON scheduler_jobs
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Analytics
ALTER TABLE kpi_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY kpi_readings_tenant ON kpi_readings
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_goals_tenant ON business_goals
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

ALTER TABLE executive_briefings ENABLE ROW LEVEL SECURITY;
CREATE POLICY executive_briefings_tenant ON executive_briefings
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Notifications
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_deliveries_tenant ON notification_deliveries
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());

-- Feature flags: global flags visible to all; org flags visible to that org
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY feature_flags_access ON feature_flags FOR SELECT
  USING (org_id IS NULL OR org_id = boss_current_org_id());
CREATE POLICY feature_flags_tenant_write ON feature_flags
  FOR ALL
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
```

---

## Reference Tables (No RLS Required)

These tables contain platform-wide reference/catalog data and have no tenant scope:

```
constraint_categories, constraint_definitions
recommendation_categories, recommendation_definitions
capability_contracts, provider_definitions, tool_definitions
business_mri_questions
```

Access to these tables is read-only and safe to expose without RLS.

---

## Soft-Delete Interaction with RLS

RLS policies do not filter `deleted_at IS NULL` — that filtering is the application layer's responsibility in queries. RLS only enforces tenant boundary. This design:

1. Allows privileged admin processes to audit soft-deleted records
2. Keeps RLS policies simple and fast
3. Lets application logic decide retention behavior
