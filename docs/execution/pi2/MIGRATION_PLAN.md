# PI-2 Migration Plan

Date: 2026-06-27
Status: design only; no migration created

## Naming Constraint

Do not create `capabilities`: `business_capabilities` already stores tenant
maturity assessments, while `capabilityRegistry` stores atomic abilities.

## Proposed Additive Schema

The first migration should use a `business_outcome_` prefix:

| Table | Purpose |
| --- | --- |
| `business_outcome_plans` | Tenant aggregate, source recommendation, lifecycle and current version |
| `business_outcome_plan_versions` | Immutable manifest snapshots and definition version |
| `business_outcome_plan_references` | Typed ID/version references to existing registries |
| `business_outcome_plan_approvals` | Actor, decision, reason, policy and trace |
| `business_outcome_plan_history` | Append-only lifecycle and execution history |
| `business_outcome_plan_kpis` | Baseline, target and measured outcome references |

Separate workflow/agent/automation join tables are unnecessary until query
evidence proves the typed reference table insufficient.

## Required Constraints

- UUID primary keys and non-null `org_id`/`business_id`.
- Unique `(org_id, plan_key)` and `(plan_id, version)`.
- Unique `(plan_version_id, reference_type, reference_id)`.
- Foreign keys to business, source recommendation and plan parent.
- Lifecycle check constraint and manifest schema version.
- Soft delete only on plan; history and approvals are append-only.
- RLS plus explicit tenant predicates in every repository query.
- Indexes on organization/lifecycle, business, recommendation and references.

## Rollout

1. Add schema with no readers or writers.
2. Validate migration and RLS in isolated PostgreSQL.
3. Add repository adapters behind interfaces.
4. Add application service under a disabled feature flag.
5. Seed one definition mapping one approved recommendation to one workflow.
6. Run shadow resolution without execution.
7. Enable internal manual approval and execution for one tenant.
8. Roll back by disabling the flag; retain additive tables.

No backfill is required. Existing recommendations remain valid without plans.

## Rollback

Application rollback never drops data. Disable plan creation/execution, leave
tables readable for audit, and revert adapters. Destructive down migrations are
prohibited.
