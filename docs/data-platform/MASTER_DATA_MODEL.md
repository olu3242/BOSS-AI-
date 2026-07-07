# BOSS Enterprise Data Platform — Master Data Model

> Version: 1.0.0 | Status: Canonical | Owner: Platform Architecture

## Purpose

This document is the single source of truth for the BOSS data platform. Every
database migration, API contract, workflow definition, AI agent, KPI, event, and
UI component is traceable to an entity defined here.

---

## Platform Overview

BOSS (Business Operating System Suite) is a multi-tenant AI-native platform
that enables small businesses to operate like enterprises. The data platform
underpins nine Operating Systems (OS):

| # | Operating System | Primary Domain |
|---|-----------------|----------------|
| 1 | Identity OS | Organizations, memberships, auth |
| 2 | Business Intelligence OS | Business profile, DNA, MRI, health |
| 3 | Constraint & Recommendation OS | Problems, roadmaps, scoring |
| 4 | Decision OS | AI-generated decisions, scenarios |
| 5 | Workflow & Loop OS | Workflow execution, scheduling |
| 6 | AI Workforce OS | AI employees, memory, inference |
| 7 | Customer & Sales OS | CRM, leads, jobs, invoices, payments |
| 8 | Integration & Tool OS | Provider integrations, credentials |
| 9 | Analytics & Reporting OS | KPIs, events, briefings |

---

## Architectural Laws

**Law 1 — MCP owns all intelligence. Loop owns all execution. They never swap roles.**
- MCP: recommendations, diagnostics, AI reasoning, industry models
- Loop: workflow state, retries, compensations, audit

**Law 2 — Everything is measurable or it doesn't ship.**
- Every entity emits domain events
- Every mutation is audited
- Every KPI has a defined formula and measurement frequency

---

## Global Conventions

All tables follow these conventions unless explicitly documented otherwise:

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
org_id      uuid NOT NULL                        -- tenant isolation, always set
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
deleted_at  timestamptz                          -- null = active (soft delete)
```

**Tenant Isolation**: Every mutable table carries `org_id`. RLS policies enforce
`org_id = boss_current_org_id()` for all tenant-scoped tables.

**Audit**: Append-only audit/event tables have no `deleted_at` and no `updated_at`.

**Versioning**: Entities with optimistic-concurrency use a `version` or `lock_version`
integer column.

**Events**: Every state change publishes a domain event to the EventBus before returning.

---

## Domain Map

```
Identity ──────────────────────────────────────────────────────────────
  organizations, organization_memberships, user_tenant_preferences,
  identity_audit_events

Business Intelligence ─────────────────────────────────────────────────
  businesses, business_profiles, business_mri, business_mri_sections,
  business_mri_questions, business_mri_responses, business_dna,
  business_health, business_health_dimensions, business_capabilities,
  business_timeline

Discovery & Knowledge Graph ───────────────────────────────────────────
  business_discoveries, business_context_versions, business_discovery_history,
  business_graphs, business_graph_nodes, business_graph_edges,
  business_graph_snapshots, business_graph_history

Constraint Intelligence ───────────────────────────────────────────────
  constraint_categories, constraint_definitions, constraint_instances,
  constraint_evidence, constraint_relationships, constraint_scores,
  constraint_priorities, constraint_history

Recommendation Intelligence ───────────────────────────────────────────
  recommendation_categories, recommendation_definitions, recommendation_instances,
  recommendation_constraint_links, recommendation_evidence,
  recommendation_roi_estimates, recommendation_scores, recommendation_priorities,
  transformation_roadmaps, transformation_roadmap_stages, recommendation_history

Decision & Scenario ───────────────────────────────────────────────────
  business_decisions, business_scenarios, scenario_comparisons

Diagnostics ───────────────────────────────────────────────────────────
  diagnostic_reports, diagnostic_area_scores, diagnostic_root_causes,
  diagnostic_opportunities, diagnostic_maturity_assessments,
  diagnostic_priority_items

KPI, Goals & Briefings ────────────────────────────────────────────────
  kpi_readings, business_goals, executive_briefings

Customer & Sales OS ───────────────────────────────────────────────────
  customers, customer_interactions, leads, jobs, appointments,
  invoices, payments, customer_reviews

Integration & Tool Fabric ─────────────────────────────────────────────
  capability_contracts, provider_definitions, tool_definitions,
  integration_accounts, credential_references, permission_policies,
  tool_executions, provider_health, tool_audit_history, provider_evidence,
  provider_credentials, provider_credential_audit

Loop Runtime ──────────────────────────────────────────────────────────
  workflow_executions, task_executions, execution_events, dead_letter_queue,
  runtime_workers, runtime_jobs, runtime_schedules, runtime_events,
  runtime_checkpoints, agent_executions, scheduler_jobs

AI Workforce ──────────────────────────────────────────────────────────
  memory_records

Event & Audit ─────────────────────────────────────────────────────────
  event_log, mvp_journey_events

Platform Infrastructure ───────────────────────────────────────────────
  feature_flags, notification_deliveries
```

---

## Migration Sequence

| Migration | Name | Tables Introduced |
|-----------|------|-------------------|
| 0001 | business_intelligence | businesses, business_profiles, business_mri, business_mri_sections, business_mri_questions, business_mri_responses, business_dna, business_health, business_health_dimensions, business_capabilities, business_timeline |
| 0002 | seed_mri_questions | (seed data) |
| 0003 | seed_sample_business | (seed data) |
| 0004 | constraint_intelligence | constraint_categories, constraint_definitions, constraint_instances, constraint_evidence, constraint_relationships, constraint_scores, constraint_priorities, constraint_history |
| 0005 | seed_constraint_library | (seed data) |
| 0006 | recommendation_intelligence | recommendation_categories, recommendation_definitions, recommendation_instances, recommendation_constraint_links, recommendation_evidence, recommendation_roi_estimates, recommendation_scores, recommendation_priorities, transformation_roadmaps, transformation_roadmap_stages, recommendation_history |
| 0007 | seed_recommendation_library | (seed data) |
| 0008 | tool_integration_fabric | capability_contracts, provider_definitions, tool_definitions, integration_accounts, credential_references, permission_policies, tool_executions, provider_health, tool_audit_history |
| 0009 | seed_tool_fabric | (seed data) |
| 0010 | loop_runtime | workflow_executions (v1), task_executions, execution_events, dead_letter_queue |
| 0011 | ai_employee_memory | memory_records |
| 0012 | tool_execution_telemetry | ALTER tool_executions (attempt_count, latency_ms) |
| 0013 | provider_evidence | provider_evidence |
| 0014 | scheduler | scheduler_jobs |
| 0015 | decisions | business_decisions |
| 0016 | scenarios | business_scenarios, scenario_comparisons |
| 0017 | event_log | event_log |
| 0018 | runtime_durability | runtime_workers, workflow_executions (v2), runtime_jobs, runtime_schedules, runtime_events, agent_executions, runtime_checkpoints |
| 0019 | mvp_journey_metrics | mvp_journey_events |
| 0020 | business_diagnostic_engine | diagnostic_reports, diagnostic_area_scores, diagnostic_root_causes, diagnostic_opportunities, diagnostic_maturity_assessments, diagnostic_priority_items |
| 0021 | identity_organizations | organizations, organization_memberships, user_tenant_preferences, identity_audit_events |
| 0022 | business_discovery_context | business_discoveries, business_context_versions, business_discovery_history |
| 0023 | business_knowledge_graph | business_graphs, business_graph_nodes, business_graph_edges, business_graph_snapshots, business_graph_history |
| 0024 | kpi_readings_goals_briefings | kpi_readings, business_goals, executive_briefings |
| 0025 | customer_os | customers, customer_interactions |
| 0026 | jobs | jobs |
| 0027 | appointments | appointments |
| 0028 | invoices | invoices |
| 0029 | payments | payments |
| 0030 | customer_reviews | customer_reviews |
| 0031 | notification_deliveries | notification_deliveries |
| 0032 | provider_credentials | provider_credentials, provider_credential_audit |
| 0033 | feature_flags | feature_flags |
| 0034 | leads | leads |

**Total tables: 82** (including junction, audit, and reference tables)

---

## Row-Level Security Status

RLS is enabled on:

| Tables with RLS | Policy |
|----------------|--------|
| workflow_executions, runtime_jobs, runtime_schedules, runtime_events, agent_executions, runtime_checkpoints | `org_id = boss_current_org_id()` |
| diagnostic_reports, diagnostic_area_scores, diagnostic_root_causes, diagnostic_opportunities, diagnostic_maturity_assessments, diagnostic_priority_items | `org_id = boss_current_org_id()` |
| business_discoveries, business_context_versions, business_discovery_history | `org_id = boss_current_org_id()` |
| business_graphs, business_graph_nodes, business_graph_edges, business_graph_snapshots, business_graph_history | `org_id = boss_current_org_id()` |
| organizations | member SELECT only |
| organization_memberships | self SELECT only |
| user_tenant_preferences | self policy |
| identity_audit_events | actor or org-member SELECT |
| mvp_journey_events | `org_id = boss_current_org_id()` |
| jobs, appointments, invoices, payments, customer_reviews | `org_id = boss_current_org_id()` |

**Remaining tables require RLS enablement** — see MIGRATION_ROADMAP.md.

---

## Industry Pack Extension Model

The platform is extended through industry packs installed via the registry system.
No core tables are modified. Industry packs add:

- AI employee definitions (registered in `aiEmployeeRegistry`)
- KPI definitions with formulas and targets (registered in `kpiRegistry`)
- Workflow templates (registered in `workflowRegistry`)
- MRI question sets and industry benchmarks

**Available packs (11):** general-smb, accounting, cleaning, coffee-shop, dental, home-care, home-services, landscaping, legal, restaurant, retail

---

*See companion documents for full entity definitions, relationship diagrams, security
model, API mappings, and migration roadmap.*
