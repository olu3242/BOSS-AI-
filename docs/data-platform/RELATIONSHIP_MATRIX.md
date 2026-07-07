# BOSS Relationship Matrix

> Version: 1.0.0 | Foreign key dependencies, cardinalities, and cascade behaviors

---

## Core Relationship Map

### Identity → Business

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| organizations | businesses | 1:N | businesses.org_id | DELETE RESTRICT |
| organizations | organization_memberships | 1:N | organization_memberships.org_id | DELETE CASCADE |
| organizations | feature_flags | 1:N | feature_flags.org_id | DELETE CASCADE |

### Business → Intelligence

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | business_profiles | 1:1 | business_profiles.business_id | DELETE CASCADE |
| businesses | business_dna | 1:1 | business_dna.business_id | DELETE CASCADE |
| businesses | business_health | 1:N | business_health.business_id | DELETE CASCADE |
| businesses | business_capabilities | 1:N | business_capabilities.business_id | DELETE CASCADE |
| businesses | business_timeline | 1:N | business_timeline.business_id | DELETE CASCADE |
| businesses | business_mri | 1:N | business_mri.business_id | DELETE CASCADE |
| business_health | business_health_dimensions | 1:N | business_health_dimensions.business_health_id | DELETE CASCADE |
| business_mri | business_mri_sections | 1:N | business_mri_sections.business_mri_id | DELETE CASCADE |
| business_mri | business_mri_responses | 1:N | business_mri_responses.business_mri_id | DELETE CASCADE |

### Business → Constraint Intelligence

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | constraint_instances | 1:N | constraint_instances.business_id | DELETE CASCADE |
| constraint_instances | constraint_evidence | 1:N | constraint_evidence.constraint_instance_id | DELETE CASCADE |
| constraint_instances | constraint_relationships | 1:N | constraint_relationships.constraint_instance_id | DELETE CASCADE |
| constraint_instances | constraint_history | 1:N | constraint_history.constraint_instance_id | DELETE CASCADE |
| constraint_instances | constraint_scores | 1:1 | constraint_scores.constraint_instance_id | DELETE CASCADE |
| constraint_instances | constraint_priorities | 1:1 | constraint_priorities.constraint_instance_id | DELETE CASCADE |

### Business → Recommendation Intelligence

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | recommendation_instances | 1:N | recommendation_instances.business_id | DELETE CASCADE |
| recommendation_instances | recommendation_constraint_links | M:N junction | both FKs | DELETE CASCADE |
| constraint_instances | recommendation_constraint_links | M:N junction | both FKs | DELETE CASCADE |
| recommendation_instances | recommendation_evidence | 1:N | recommendation_evidence.recommendation_instance_id | DELETE CASCADE |
| recommendation_instances | recommendation_scores | 1:1 | recommendation_scores.recommendation_instance_id | DELETE CASCADE |
| recommendation_instances | recommendation_priorities | 1:1 | recommendation_priorities.recommendation_instance_id | DELETE CASCADE |
| recommendation_instances | recommendation_history | 1:N | recommendation_history.recommendation_instance_id | DELETE CASCADE |
| businesses | transformation_roadmaps | 1:N | transformation_roadmaps.business_id | DELETE CASCADE |
| transformation_roadmaps | transformation_roadmap_stages | 1:N | transformation_roadmap_stages.transformation_roadmap_id | DELETE CASCADE |

### Business → Decision & Scenario

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | business_decisions | 1:N | business_decisions.business_id | DELETE CASCADE |
| business_decisions | execution_plans | 1:1 | execution_plans.decision_id | DELETE CASCADE |
| business_decisions | outcome_verifications | 1:N | outcome_verifications.decision_id | DELETE CASCADE |
| businesses | business_scenarios | 1:N | business_scenarios.business_id | DELETE CASCADE |

### Business → Customer & Sales

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | customers | 1:N | customers.business_id | DELETE CASCADE |
| businesses | leads | 1:N | leads.business_id | DELETE CASCADE |
| businesses | jobs | 1:N | jobs.business_id | DELETE CASCADE |
| businesses | appointments | 1:N | appointments.business_id | DELETE CASCADE |
| businesses | invoices | 1:N | invoices.business_id | DELETE CASCADE |
| customers | customer_interactions | 1:N | customer_interactions.customer_id | DELETE CASCADE |
| customers | invoices | 1:N | invoices.customer_id | SET NULL |
| customers | payments | 1:N | payments.customer_id | SET NULL |
| customers | appointments | 1:N | appointments.customer_id | SET NULL |
| customers | jobs | 1:N | jobs.customer_id | SET NULL |
| customers | customer_reviews | 1:N | customer_reviews.customer_id | SET NULL |
| invoices | payments | 1:N | payments.invoice_id | RESTRICT |
| leads | customers | M:1 | leads.converted_customer_id | SET NULL |

### Business → KPI & Goals

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | kpi_readings | 1:N | kpi_readings.business_id | DELETE CASCADE |
| businesses | business_goals | 1:N | business_goals.business_id | DELETE CASCADE |
| businesses | executive_briefings | 1:N | executive_briefings.business_id | DELETE CASCADE |

### Business → Integration

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | integration_accounts | 1:N | integration_accounts.business_id | DELETE CASCADE |
| integration_accounts | credential_references | 1:N | credential_references.integration_account_id | DELETE CASCADE |
| businesses | permission_policies | 1:N | permission_policies.business_id | DELETE CASCADE |
| businesses | tool_executions | 1:N | tool_executions.business_id | DELETE CASCADE |
| businesses | provider_health | 1:N | provider_health.business_id | DELETE CASCADE |
| tool_executions | tool_audit_history | 1:N | tool_audit_history.tool_execution_id | DELETE CASCADE |
| tool_executions | provider_evidence | 1:N | provider_evidence.tool_execution_id | DELETE CASCADE |

### Business → Loop Runtime

| From | To | Cardinality | FK | Cascade |
|------|----|-------------|-----|---------|
| businesses | workflow_executions | 1:N | workflow_executions.business_id | DELETE CASCADE |
| workflow_executions | task_executions | 1:N | task_executions.workflow_execution_id | DELETE CASCADE |
| workflow_executions | execution_events | 1:N | execution_events.workflow_execution_id | DELETE CASCADE |
| workflow_executions | dead_letter_queue | 1:N | dead_letter_queue.workflow_execution_id | SET NULL |
| businesses | scheduler_jobs | 1:N | scheduler_jobs.business_id | DELETE CASCADE |
| businesses | memory_records | 1:N | memory_records.business_id | DELETE CASCADE |

---

## Many-to-Many Junction Tables

| Table | Left Entity | Right Entity | Extra Fields |
|-------|-------------|--------------|--------------|
| `recommendation_constraint_links` | recommendation_instances | constraint_instances | link_type, weight |
| `transformation_roadmap_stages` | transformation_roadmaps | recommendation_instances | stage, sequence |
| `organization_memberships` | organizations | (user_id text) | role, status |

---

## Cross-Context References (Soft FKs)

These references use `text` columns (user IDs from auth) rather than hard FKs:

| Table | Field | References |
|-------|-------|-----------|
| organizations | created_by | auth.users (external) |
| organization_memberships | user_id | auth.users (external) |
| leads | assigned_to | auth.users (external) |
| jobs | assigned_to | auth.users (external) |
| appointments | assigned_to | auth.users (external) |
| tool_executions | requested_by | auth.users OR agent key |

---

## Orphan Prevention Rules

| Table | Strategy |
|-------|---------|
| `payments` | Cannot delete invoice with payments (RESTRICT) |
| `customers` with revenue | Soft-delete only; hard delete blocked if `total_revenue > 0` |
| `provider_credentials` | Never cascaded; must be explicitly rotated/deleted |
| `event_log` | Append-only; no deletes ever |
| `identity_audit_events` | Append-only; no deletes ever |
