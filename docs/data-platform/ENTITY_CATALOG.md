# BOSS Entity Catalog

> Version: 1.0.0 | 82 entities across 9 Operating Systems

Each entry documents: owning OS, primary key, key relationships, status lifecycle, canonical events, AI consumers, and KPI impact.

---

## Identity OS

### Organization
- **Purpose**: Root tenant. Every piece of data belongs to an organization.
- **Table**: `organizations`
- **PK**: `id uuid`
- **Key fields**: `name`, `slug` (unique), `plan`, `status (active|trial|suspended)`, `created_by`
- **Lifecycle**: `trial → active → suspended`
- **Events**: (none — created by auth system)
- **AI consumers**: Platform-wide context for all agents

### OrganizationMembership
- **Purpose**: Maps users to organizations with a role.
- **Table**: `organization_memberships`
- **PK**: `(organization_id, user_id)` composite
- **Roles**: `owner | admin | operator | viewer`
- **Status**: `active | suspended`
- **Events**: identity audit via `identity_audit_events`

### UserTenantPreferences
- **Purpose**: Stores the user's currently active organization.
- **Table**: `user_tenant_preferences`
- **PK**: `user_id text`

### IdentityAuditEvent
- **Purpose**: Immutable audit trail for all auth and permission actions.
- **Table**: `identity_audit_events`
- **Append-only**: no `updated_at`, no `deleted_at`
- **Key fields**: `actor_id`, `action`, `resource_type`, `resource_id`, `outcome (success|failure|denied)`, `trace_id`

---

## Business Intelligence OS

### Business
- **Purpose**: Core business entity. Root of all business-scoped data.
- **Table**: `businesses`
- **PK**: `id uuid`
- **FK**: `org_id` (tenant)
- **Key fields**: `name`, `industry`, `employee_count`, `annual_revenue`
- **Soft delete**: `deleted_at`
- **Events**: `business.created`, `business_created`
- **AI consumers**: All AI employees use business context

### BusinessProfile
- **Purpose**: Extended profile with operational details.
- **Table**: `business_profiles`
- **PK**: `id uuid`; UNIQUE on `business_id`
- **FK**: `business_id → businesses`
- **Key fields**: `business_type`, `years_operating`, `location_count`, `business_hours`

### BusinessMri (Market Readiness Inventory)
- **Purpose**: Multi-section diagnostic questionnaire; the entry point for all intelligence.
- **Table**: `business_mri`
- **Status**: `not_started | in_progress | completed`
- **Events**: `business.mri.started`, `business.mri.completed`
- **Child entities**: `business_mri_sections`, `business_mri_questions`, `business_mri_responses`

### BusinessDna
- **Purpose**: AI-derived personality profile driving recommendation tone and approach.
- **Table**: `business_dna`
- **UNIQUE**: `business_id`
- **Key fields**: `archetype`, `growth_stage`, `operational_complexity`, `technology_maturity`, `automation_readiness`, `revenue_model`, `risk_profile`
- **Events**: `business_dna_generated`
- **AI consumers**: All recommendation and diagnostic engines

### BusinessHealth
- **Purpose**: Composite health score across multiple dimensions.
- **Table**: `business_health`; child `business_health_dimensions`
- **Dimension status**: `strong | healthy | at_risk | critical`
- **Trend**: `improving | stable | declining | unknown`
- **Events**: `business.health.calculated`, `business_health_updated`
- **KPI impact**: `smb_net_profit_margin`, health-driving KPIs

### BusinessCapability
- **Purpose**: Tracks maturity of each operational capability.
- **Table**: `business_capabilities`
- **Maturity**: `absent | ad_hoc | developing | managed | optimized`
- **Importance**: `low | medium | high | critical`
- **Events**: `capability_updated`

### BusinessTimeline
- **Purpose**: Append-only event log of notable business events for context.
- **Table**: `business_timeline`
- **Key fields**: `type`, `description`, `metadata jsonb`, `occurred_at`

---

## Discovery & Knowledge Graph

### BusinessDiscovery
- **Purpose**: Versioned canonical business context used by all AI services.
- **Table**: `business_discoveries`
- **Status**: `draft | in_progress | validated | published | archived`
- **Versioning**: `current_version`, `lock_version` for optimistic concurrency
- **RLS**: enabled

### BusinessContextVersion
- **Purpose**: Immutable snapshot of business context at each version.
- **Table**: `business_context_versions`
- **Key fields**: `context jsonb` (full context snapshot), `schema_version`

### BusinessGraph
- **Purpose**: Knowledge graph of business entities, relationships, and capabilities.
- **Tables**: `business_graphs`, `business_graph_nodes`, `business_graph_edges`, `business_graph_snapshots`, `business_graph_history`
- **Node types**: entity, capability, kpi, constraint, etc.
- **Edge types**: relationship descriptors
- **RLS**: enabled on all tables

---

## Constraint Intelligence OS

### ConstraintCategory / ConstraintDefinition
- **Purpose**: Registry-driven catalog of constraint types and categories.
- **Tables**: `constraint_categories`, `constraint_definitions`
- **Reference data**: seeded from industry packs; no `org_id`

### ConstraintInstance
- **Purpose**: A specific business problem identified for a tenant.
- **Table**: `constraint_instances`
- **Severity**: `critical | high | medium | low | informational`
- **Status**: `active | monitoring | resolved | dismissed`
- **Key fields**: `revenue_loss_annual`, `time_lost_hours_weekly`, `confidence`, `automation_potential`
- **Events**: `business.constraints.analyzed`, `business.constraint.status_updated`
- **AI consumers**: DiagnosticEngine, RecommendationEngine, BTE

### ConstraintScore / ConstraintPriority
- **Purpose**: Computed scoring and ranking for prioritization.
- **Tables**: `constraint_scores`, `constraint_priorities`
- **UNIQUE**: one score and one priority per constraint instance

---

## Recommendation Intelligence OS

### RecommendationInstance
- **Purpose**: An AI-generated action for a tenant to improve their business.
- **Table**: `recommendation_instances`
- **Status**: `proposed | approved | rejected | in_progress | completed | dismissed`
- **Approval**: `auto | approval_required | executive_review | manual_only`
- **Stage**: `quick_wins | short_term | medium_term | strategic | long_term`
- **Events**: `business.recommendations.generated`, `business.recommendation.approved`
- **AI consumers**: BTE, Decision engine, AI employees

### RecommendationRoiEstimate
- **Purpose**: Projected financial and operational ROI for a recommendation.
- **Table**: `recommendation_roi_estimates`
- **Key fields**: `revenue_increase_annual`, `time_saved_hours_weekly`, `profit_impact_annual`

### TransformationRoadmap
- **Purpose**: Groups recommendations into a time-staged execution plan.
- **Tables**: `transformation_roadmaps`, `transformation_roadmap_stages`
- **Stages**: quick_wins, short_term, medium_term, strategic, long_term

---

## Decision & Scenario OS

### BusinessDecision
- **Purpose**: AI-generated business decisions with approval workflow and outcome tracking.
- **Table**: `business_decisions`
- **Status**: `draft | generated | reviewed | approved | rejected | scheduled | executing | completed | measured | archived`
- **Key fields**: `decision_type`, `options jsonb`, `confidence_score`, `expected_roi`, `actual_roi`
- **Events**: `business.decision.generated`, `decision.approved`, `decision.rejected`, `decision.measured`
- **AI consumers**: DecisionEngine, BTE

### BusinessScenario
- **Purpose**: What-if scenario simulation comparing different strategic choices.
- **Table**: `business_scenarios`
- **Status**: `draft | calculated | approved | rejected | archived`
- **Key fields**: `projected_revenue`, `projected_cost`, `risk_level`, `forecast_period`
- **Events**: `scenario.created`, `scenario.forecast.generated`, `scenario.compared`

---

## Diagnostics OS

### DiagnosticReport
- **Purpose**: Complete structured diagnostic output from the Business Diagnostic Engine.
- **Table**: `diagnostic_reports`
- **Versioned**: UNIQUE `(business_id, version)`
- **Status**: `completed | superseded`
- **Child tables**: `diagnostic_area_scores`, `diagnostic_root_causes`, `diagnostic_opportunities`, `diagnostic_maturity_assessments`, `diagnostic_priority_items`
- **Events**: `diagnostic_completed`
- **RLS**: enabled

---

## KPI, Goals & Briefings

### KpiReading
- **Purpose**: Time-series KPI measurements for trending and alerting.
- **Table**: `kpi_readings`
- **Key fields**: `kpi_key`, `value`, `unit`, `trend`, `source`, `measured_at`
- **Events**: `business.kpi.measured`, `kpi.threshold.exceeded`
- **AI consumers**: All AI employees reference KPI readings for context

### BusinessGoal
- **Purpose**: OKR-style goals with KPI linkage and milestone tracking.
- **Table**: `business_goals`
- **Key fields**: `category`, `kpi_key`, `target_value`, `current_value`, `milestones jsonb`, `status`
- **Events**: `business.goal.created`, `business.goal.status_updated`

### ExecutiveBriefing
- **Purpose**: AI-generated periodic executive summary.
- **Table**: `executive_briefings`
- **Key fields**: `period`, `headline`, `top_priorities jsonb`, `key_metrics jsonb`, `alerts jsonb`
- **Events**: `business.briefing.generated`

---

## Customer & Sales OS

### Customer
- **Purpose**: CRM record for a business's customers.
- **Table**: `customers`
- **Status**: `prospect | active | at_risk | churned` (stored as text)
- **Key fields**: `first_name`, `last_name`, `email`, `phone`, `tags[]`, `total_revenue`, `health_score`
- **Events**: `customer.created`
- **AI consumers**: Customer Success AI employee

### CustomerInteraction
- **Purpose**: Log of all touchpoints with a customer.
- **Table**: `customer_interactions`
- **FK**: `customer_id → customers`
- **Key fields**: `type`, `summary`, `metadata jsonb`, `occurred_at`

### Lead
- **Purpose**: Prospective customer in the sales pipeline.
- **Table**: `leads`
- **Status**: `new | contacted | qualified | converted | lost`
- **Events**: `lead.created`, `lead.qualified`, `lead.assigned`, `lead.converted`
- **AI consumers**: Sales Manager AI employee

### Job
- **Purpose**: Service delivery unit — a piece of work to be scheduled and performed.
- **Table**: `jobs`
- **Status**: `draft | scheduled | in_progress | on_hold | completed | cancelled`
- **Priority**: `low | normal | high | urgent`
- **FK**: optional `customer_id → customers`
- **Events**: `job.created`, `job.completed`, `job.status_changed`

### Appointment
- **Purpose**: Scheduled time block for a job or customer meeting.
- **Table**: `appointments`
- **Status**: `scheduled | confirmed | in_progress | completed | cancelled | no_show`
- **FK**: optional `customer_id`, `job_id`
- **Events**: `appointment.created`, `appointment.confirmed`, `appointment.cancelled`

### Invoice
- **Purpose**: Financial document sent to customers for services rendered.
- **Table**: `invoices`
- **Status**: `draft | sent | viewed | paid | overdue | cancelled | refunded`
- **Key fields**: `invoice_number` (unique per org), `line_items jsonb`, `subtotal_cents`, `tax_cents`, `total_cents`
- **Events**: `invoice.created`, `invoice.sent`, `invoice.paid`

### Payment
- **Purpose**: Records a payment against an invoice.
- **Table**: `payments`
- **Status**: `pending | completed | failed | refunded`
- **Method**: `cash | card | bank_transfer | check | other`
- **FK**: `invoice_id → invoices`, `customer_id → customers`
- **Events**: `payment.created`, `payment.received`

### CustomerReview
- **Purpose**: Customer feedback and external review tracking.
- **Table**: `customer_reviews`
- **Status**: `pending | published | flagged | hidden`
- **Source**: `internal | google | yelp | facebook`
- **Key fields**: `rating (1–5)`, `response`, `responded_at`
- **Events**: `review.received`

---

## Integration & Tool OS

### CapabilityContract
- **Purpose**: Abstract capability definitions (e.g., "send_email") that tools implement.
- **Table**: `capability_contracts`
- **Key fields**: `capability_key`, `input_schema jsonb`, `output_schema jsonb`
- **Reference data**: no `org_id`

### ProviderDefinition
- **Purpose**: Catalog of integration providers (e.g., SendGrid, Twilio).
- **Table**: `provider_definitions`
- **Category**: `email | sms | calendar | crm | accounting | storage | messaging | payments`
- **Auth type**: `oauth2 | api_key | basic | none`
- **Reference data**: no `org_id`

### ToolDefinition
- **Purpose**: Specific tool implementation linking a provider to a capability.
- **Table**: `tool_definitions`
- **Key fields**: `tool_key`, `capability_key`, `retry_limit`, `timeout_ms`, `rate_limit_per_minute`, `audit_level`
- **Audit level**: `none | standard | sensitive`

### IntegrationAccount
- **Purpose**: A tenant's connection to a specific provider.
- **Table**: `integration_accounts`
- **Status**: `connected | disconnected | error`
- **UNIQUE**: `(business_id, provider_key)`
- **Events**: `marketplace.pack.installed`, `marketplace.pack.uninstalled`

### ToolExecution
- **Purpose**: Immutable record of every tool invocation with input/output.
- **Table**: `tool_executions`
- **Status**: `pending | succeeded | failed | rejected`
- **Key fields**: `input jsonb`, `output jsonb`, `attempt_count`, `latency_ms`
- **Events**: `tool.execution.requested`, `tool.execution.succeeded`, `tool.execution.failed`

### ProviderCredential
- **Purpose**: AES-256-GCM encrypted secrets for provider API keys.
- **Table**: `provider_credentials`
- **Key fields**: `secret_key`, `ciphertext`, `iv`, `auth_tag`, `rotated_at`, `expires_at`
- **Audit**: `provider_credential_audit` (actions: get/put/rotate/delete)

---

## Loop Runtime OS

### WorkflowExecution
- **Purpose**: Instance of a workflow definition being executed.
- **Table**: `workflow_executions`
- **State**: `pending | running | awaiting_approval | compensating | completed | compensated | failed`
- **Key fields**: `definition_id`, `current_step_id`, `completed_step_ids jsonb`, `outputs jsonb`
- **RLS**: enabled

### RuntimeJob
- **Purpose**: Durable job queue entry with lease-based worker assignment.
- **Table**: `runtime_jobs`
- **State**: `pending | running | completed | dead_letter`
- **Key fields**: `queue_name`, `idempotency_key`, `attempts`, `maximum_attempts`, `lease_owner`, `lease_expires_at`
- **RLS**: enabled

### SchedulerJob
- **Purpose**: Time-based trigger for workflow execution.
- **Table**: `scheduler_jobs`
- **Trigger type**: `immediate | delayed | cron | recurring`
- **State**: `pending | running | completed | failed | cancelled`
- **Events**: `scheduler.job.executed`

### MemoryRecord
- **Purpose**: Key-value store for AI agent runtime memory.
- **Table**: `memory_records`
- **Owner types**: `agent | business`
- **UNIQUE**: `(org_id, business_id, owner_type, owner_id, key)`
- **TTL**: `expires_at` (null = permanent)

---

## Analytics & Audit

### EventLog
- **Purpose**: Durable append-only log of all domain events.
- **Table**: `event_log`
- **Key fields**: `type`, `payload jsonb`, `occurred_at`, `org_id`, `correlation_id`, `causation_id`
- **Append-only**: no updates, no deletes

### MvpJourneyEvent
- **Purpose**: Product analytics tracking user progression through the BOSS activation funnel.
- **Table**: `mvp_journey_events`
- **Stages**: landing_viewed → signup_completed → ... → first_value_visible
- **UNIQUE**: `(journey_id, stage)` — each stage recorded once

### NotificationDelivery
- **Purpose**: Audit trail for every outbound notification sent.
- **Table**: `notification_deliveries`
- **Channel**: `sms | email | slack | teams | push | voice | internal`
- **Status**: `pending | sent | delivered | failed`
- **Events**: `notification.sent`, `notification.failed`

### FeatureFlag
- **Purpose**: Runtime feature toggle with org-scoped overrides.
- **Table**: `feature_flags`
- **Key fields**: `org_id` (null = global), `flag_key`, `enabled`
- **Resolution order**: DB org-scoped → DB global → env var → default
