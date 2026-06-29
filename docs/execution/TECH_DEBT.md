# Technical Debt Register

Track debt explicitly instead of letting it hide in TODO comments.
Each entry should be small enough to become a single PR.

| ID | Description | Introduced | Severity | Owner | Status |
|----|--------------|-----------|----------|-------|--------|
| TD-001 | `apps/web` is a placeholder TS entrypoint, not a real Next.js app — no Business Setup/MRI/DNA/Health/Timeline pages yet | Goal 0 | High | unassigned | open |
| TD-002 | `apps/api` has typed services/controllers (Goal 2) but no HTTP transport (Express/Fastify/Next route handlers) wired up yet | Goal 0 | High | unassigned | open |
| TD-003 | Database/Supabase wiring implemented for the Business Intelligence Layer only (Goal 2); the rest of `docs/architecture/ARCHITECTURE.md` §6 schema is not implemented | Goal 0 | High | unassigned | open |
| TD-004 | `packages/ui`, `packages/loop`, `packages/events` are typed interfaces only, no runtime implementation (`packages/mcp` gained real derivation logic in Goal 2) | Goal 0 | Medium | unassigned | open |
| TD-005 | Registries are in-memory only — no persistence, no admin UI to edit entries | Goal 0.5 | Medium | unassigned | open |
| TD-006 | No auth — CI and local dev have no permission boundary yet | Goal 0 | High | unassigned | open |
| TD-007 | Business DNA/Health/Capability derivation in `packages/mcp` is deterministic rule-based logic, explicitly not AI inference — Goal 2 forbids AI here; a later goal should decide if/how to layer LLM reasoning on top | Goal 2 | Medium | unassigned | open |
| TD-008 | `packages/db` repositories enforce `org_id` scoping in application-level WHERE clauses, not Postgres row-level security policies | Goal 2 | Medium | unassigned | open |
| TD-009 | Constraint Graph relationship (`constraint_relationships`) and history (`constraint_history`) tables are persisted but not yet exposed through any API read path | Goal 3 | Medium | unassigned | open |
| TD-010 | Capability pack installation is hardcoded to `general-smb` inside `apps/api`'s container — no runtime-configurable pack selection for multiple verticals yet | Goal 3 | Medium | unassigned | open |
| TD-011 | Transformation Roadmap and Approval Model (`auto`/`approval_required`/`executive_review`/`manual_only`) are persisted but not consumed by any runtime yet — reserved for a future Loop Runtime | Goal 4 | Medium | unassigned | open |
| TD-012 | `recommendation_instances.dependencies` is a flat `jsonb` array, not a dedicated relationship table — unlike constraints, which got `constraint_relationships` in Goal 3 | Goal 4 | Low | unassigned | open |
| TD-013 | `executeToolRequestSimulated()` is the only Execution Adapter — no real provider HTTP clients exist yet (Gmail, Twilio, HubSpot, etc.); deferred to a future Loop Runtime adapter layer | Goal 8 | High | unassigned | open |
| TD-014 | `CredentialReference.secretRef` is a schema for a pointer only — no actual external secret-store integration (e.g. Vault, AWS Secrets Manager) exists to resolve it | Goal 8 | High | unassigned | open |
| TD-015 | `ToolDefinitionEntry.rateLimitPerMinute` and `PermissionPolicy.rateLimitPerMinute` are declared but not enforced anywhere at execution time | Goal 8 | Medium | unassigned | open |
| TD-016 | No Integration Center / Connection Wizard UI exists to let a business owner actually connect (OAuth) a provider — `connectIntegration()` is API-only | Goal 8 | Medium | unassigned | open |
| TD-017 | Loop Runtime has no real scheduler — only synchronous immediate execution; no scheduled/recurring/business-hours-aware/timezone-aware job dispatch exists | EP-1 Batch 5 prereq | High | unassigned | open |
| TD-018 | Loop Runtime's `timed_out` execution state exists in the state machine but nothing ever transitions into it — no timeout enforcement at the task or workflow level | EP-1 Batch 5 prereq | Medium | unassigned | open |
| TD-019 | Loop Runtime executes workflow steps strictly sequentially — no parallel step execution and no conditional branching based on prior step output | EP-1 Batch 5 prereq | Medium | unassigned | open |
| TD-020 | Loop Runtime tracks state via `ExecutionEventRecord` + the current `state` field only — no dedicated `execution_state_history`, `scheduler_jobs`, or `execution_metrics` tables | EP-1 Batch 5 prereq | Low | unassigned | open |
| TD-021 | Canonical domain events (`business.mri.*`, `business.health.*`, `business.constraints.*`, `business.recommendations.*`, `tool.execution.*`) are live pub/sub only via the in-memory `EventBus` — no durable domain-event log, no cross-process delivery, no replay; a process restart drops all subscriptions | Goal 9 | Medium | unassigned | open |
| TD-022 | `BusinessRecommendation.relatedCapabilities` is not guaranteed to map 1:1 onto registered tool capabilities (some entries are category-like labels) — the autonomous workflow generator produces one "tool" step per entry with no upstream validation, so unresolvable capabilities deterministically fail at execution time rather than at generation time | Goal 10 | Medium | unassigned | open |

## Process

- Add an entry when you knowingly cut a corner — link the PR that
  introduced it.
- Resolve by opening a PR that closes the entry and removes the row (or
  moves it to "resolved" history below if worth keeping for context).
- Review this file at the start of every new Goal; debt blocking the
  next goal must be paid down first.
