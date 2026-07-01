# ADR-0008: Domain Event Backbone — shared `RepositoryContainer.eventBus`, `{context}.{entity}.{verb}` canonical events

**Status:** accepted
**Date:** 2026-06-29

## Context

Goal 9 required wiring canonical domain events into MRI, Health, Constraints,
Recommendations, and Tool Fabric so the `EventBus` introduced for the Loop
Runtime (ADR-0007) becomes the backbone of the platform rather than a
runtime-local implementation detail. Before this change, `createInMemoryEventBus()`
was only ever constructed inside `loopRuntimeService.ts`, with no shared
instance available to any other service, and no service published anything
to it. `businessTimeline.append()` calls existed as a durable, per-business
audit trail, but had no live pub/sub counterpart.

## Decisions

1. **`eventBus: EventBus` is a field on `RepositoryContainer`, not a separate
   constructor parameter.** Every service in `apps/api` already receives the
   single `RepositoryContainer` (`repos`) as its only dependency. Adding
   `eventBus` there means zero call sites needed to change shape — only
   `apps/api/src/container.ts`'s two factories (`createPostgresContainer()`,
   `createInMemoryContainer()`) needed to construct one
   `createInMemoryEventBus()` instance and attach it.
2. **`loopRuntimeService.ts` now consumes `repos.eventBus` instead of
   constructing its own.** This was the one existing caller of `EventBus`;
   making it use the container's shared instance is what actually makes the
   bus a single backbone rather than N independent buses.
3. **Canonical event naming follows CLAUDE.md's existing API convention:
   `{context}.{entity}.{verb}`.** e.g. `business.mri.started`,
   `business.mri.completed`, `business.health.calculated`,
   `business.constraints.analyzed`, `business.constraint.dismissed`,
   `business.recommendations.generated`, `business.recommendation.approved`,
   `tool.execution.requested`, `tool.execution.succeeded`/`tool.execution.failed`.
   This mirrors the dot-separated convention already used by
   `packages/loop/src/runtime.ts` for its own execution events.
4. **Domain events are live pub/sub only — not separately persisted.** The
   durable audit trail for business-scoped events already exists
   (`businessTimeline.append()` for MRI/Health/Constraints/Recommendations,
   `toolExecutions.addAuditRecord()` for Tool Fabric). Introducing a second,
   generic "domain event log" table would duplicate that audit trail for no
   immediate consumer. `eventBus.publish()` calls were added directly
   alongside each existing `append()`/`addAuditRecord()` call so a reader can
   see both side effects together. If a future goal needs durable replay of
   domain events specifically (as opposed to workflow execution events,
   which are already durable via `ExecutionEventPort`), that is new,
   explicitly tracked tech debt rather than something silently skipped.
5. **No new migration.** Wiring is purely an application-layer concern; no
   schema changed.

## Consequences

- `apps/api/src/container.ts`: `RepositoryContainer` gained `eventBus: EventBus`;
  both factories construct one `createInMemoryEventBus()` and share it across
  every service built from that container.
- `apps/api/src/services/loopRuntimeService.ts`: dropped its own `eventBus`
  parameter/default; now passes `repos.eventBus` into `createLoopRuntime()`.
- `apps/api/src/services/businessMriService.ts`,
  `businessHealthService.ts`, `businessConstraintService.ts`,
  `businessRecommendationService.ts`, `toolFabricService.ts`: each now calls
  `repos.eventBus.publish(...)` with a canonical event type at the same point
  it already wrote to the durable timeline/audit trail.
- `apps/api/src/__tests__/domainEventsFlow.test.ts` (new): subscribes to all
  ten canonical event types on `repos.eventBus` and asserts they fire across
  a full business → MRI → Health → Constraints → Recommendations → Tool
  Fabric flow.
- Explicitly NOT done in this slice: no dedicated domain-event persistence
  table, no event versioning/schema registry, no at-least-once delivery
  guarantees beyond the existing synchronous in-memory `Map`-based bus (a
  process restart loses any in-flight subscriptions — acceptable since there
  are no cross-process consumers yet).

## Alternatives Considered

- A new constructor parameter `eventBus: EventBus` threaded through every
  `createXService(repos, eventBus)` call: rejected — would require touching
  every call site in `apps/api/src/index.ts` and every existing test file for
  no behavioral benefit over attaching it to the container that is already
  threaded everywhere.
- A new generic `domain_events` persistence table mirroring
  `execution_events`: rejected for now — no consumer needs durable replay of
  domain events yet (Goal 10's workflow generator consumes recommendations
  directly from the repository, not from a replayed event log); adding it
  speculatively would violate the "don't build for hypothetical future
  requirements" principle. Tracked as tech debt instead.
