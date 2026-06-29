# ADR-0011: Mission Control as a read-only projection over existing execution evidence

**Status:** accepted
**Date:** 2026-06-29

## Context

Goal 12 required building "Mission Control projections and APIs from execution
evidence." By this point the platform already durably persists everything
Mission Control needs to show: `workflow_executions`, `task_executions`,
`execution_events`, and `dead_letter_queue` (Loop Runtime, ADR-0007) and
`business_timeline` (written by every business service since Goal 2). The only
non-durable source of execution evidence is the in-memory `EventBus`
(TD-021) — live pub/sub, not queryable or replayable.

## Decisions

1. **`missionControlService.ts` (`apps/api/src/services/missionControlService.ts`)
   is a pure projection — it owns no state and performs no writes.**
   `getSnapshot(orgId, businessId)` fans out across five existing
   repositories (`workflowExecutions`, `taskExecutions`, `executionEvents`,
   `deadLetters`, `businessTimeline`) and assembles a single
   `MissionControlSnapshot`. It never queries the `EventBus` — that bus is
   explicitly not a source of truth (TD-021); everything Mission Control
   shows is already written to a durable repository by the service that
   produced it.
2. **Each workflow execution is enriched with its tasks and events
   in-place** (`WorkflowExecutionSummary extends WorkflowExecution`), so a
   caller gets one shape per workflow rather than three parallel lists it
   would have to join itself.
3. **The controller (`missionControlController.ts`) is a one-method
   pass-through**, matching the established controller convention (see
   `toolFabricController.ts`) — no logic, just exposing the service through
   the same shape `apps/api`'s `createApi()` returns for every other
   context.
4. **No new persistence, no new domain events.** Mission Control reads; it
   does not need to announce that it read.

## Consequences

- Mission Control has no pagination or time-windowing on `getSnapshot()` —
  it returns the full history for a business. Fine for the in-memory/test
  scale used today; will need bounding before production traffic (tracked
  as new tech debt).
- Because Mission Control depends only on repository read methods that
  already existed before this goal, no migration was required.
- `apps/api` still has no HTTP transport (TD-002), so `missionControl` is
  reachable only as a function on the object `createApi()` returns, same as
  every other controller — consistent with existing precedent, not a new
  gap introduced by this goal.

## Alternatives considered

- Subscribing Mission Control to the `EventBus` and building its own
  read-model cache. Rejected: the durable repositories already are the read
  model; standing up a second one would duplicate state for no benefit and
  contradicts "Mission Control owns no state of its own."
