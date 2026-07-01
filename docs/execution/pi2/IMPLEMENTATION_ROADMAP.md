# PI-2 Implementation Roadmap

Date: 2026-06-27

## Gate 0: Terminology and Architecture

- Accept ADR-0007 for `packages/business-outcomes`.
- Reserve Business Outcome Plan and Business Outcome Definition names.
- Define dependency ports and prohibit Loop imports in the domain.
- Define versioned plan and event contracts.

Exit: architecture and naming review accepted.

## Gate 1: One P0 Definition

- Select one approved recommendation supported by an existing workflow.
- Promote and certify that workflow from `draft` only after runtime,
  authorization, recovery and product acceptance tests pass.
- Define one static Business Outcome Definition referencing existing IDs.
- Add reference-integrity and compatibility tests.

Exit: one definition resolves with zero broken references.

## Gate 2: Tenant Plan Foundation

- Add the six-table additive migration from `MIGRATION_PLAN.md`.
- Implement aggregate lifecycle: proposed, approved, queued, running,
  completed, failed, archived.
- Add PostgreSQL and in-memory repositories.
- Add tenant, RLS, version and lifecycle tests.

Exit: plan survives restart and cross-tenant access fails closed.

## Gate 3: Resolver and Approval

- Resolve an approved recommendation into an immutable plan version.
- Explain selected workflow, agents, automations, KPI and risks.
- Persist approval against the exact version.
- Emit versioned `business.capability.*` events.

Exit: owner can understand and approve one plan; no runtime call occurs before
approval.

## Gate 4: Runtime Adapter

- Submit one idempotent execution command.
- Reuse durable queue, WorkflowRuntime and AgentRuntime.
- Correlate execution and failures to the plan.
- Render in-app progress and visible result.
- Complete TTFBV stages `workflow_created` through `first_value_visible`.

Exit: one tenant completes the P0 journey with restart/replay evidence.

## Gate 5: Product Certification

- Browser E2E, authorization, tenant isolation and audit tests.
- Failure, retry, duplicate-delivery and recovery tests.
- Real-session TTFBV P50/P95 and completion rate.
- Typecheck, lint, tests, build, migration and architecture gates.

Exit: evidence-based beta decision.

## Deferred

CRUD breadth, search, marketplace, visual builder, simulation, optimizer,
learning, scheduled activation, public APIs and enterprise administration are
P1/P2 and do not begin during this roadmap.
