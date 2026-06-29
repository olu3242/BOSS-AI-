# ADR-0007: Loop Runtime — ports/adapters execution engine, function-based task handler registry, sequential step execution with retry/dead-letter/compensation

**Status:** accepted
**Date:** 2026-06-29

## Context

EP-1 Batches 5, 6, 9, and 10 (Autonomous Workflow Generation, AI Employee
Runtime, Evidence & Timeline, Business Operating Loop) all assume a real
execution engine exists. The convergence audit confirmed `packages/loop`
contained only type interfaces (`WorkflowState`, `WorkflowInstance`,
`LoopRuntime.start()`) with no state machine, task engine, retry/dead-letter
handling, or persistence — nothing could actually execute a workflow. This
ADR covers building that engine as the genuine blocking prerequisite,
before any higher-numbered batch is attempted, per EP-1's own "Convergence
before expansion" principle.

Two architectural constraints, enforced by `.dependency-cruiser.cjs`,
shaped every decision: `loop-never-imports-mcp` ("Loop Runtime must never
depend on MCP directly — it receives data, it doesn't reach for it") and
`loop-never-imports-industry-packs` ("Loop contains zero business
knowledge"). Per CLAUDE.md Law 1, Loop owns execution, never intelligence.

## Decisions

1. **Ports, not direct `@boss/db` dependency.** `packages/loop/src/ports.ts`
   defines `WorkflowExecutionPort`, `TaskExecutionPort`, `ExecutionEventPort`,
   `DeadLetterPort` as repository-shaped interfaces. `packages/loop` depends
   only on `@boss/types`, `@boss/shared`, `@boss/events` — never on
   `@boss/db` or `@boss/mcp`. `apps/api` is the composition root: it builds
   `RepositoryContainer` (now including `workflowExecutions`,
   `taskExecutions`, `executionEvents`, `deadLetters`) and passes those
   repositories in directly, since the new `@boss/db` repository interfaces
   were designed to satisfy the loop port shapes exactly.
2. **Task handlers are functions, keyed by `TaskType`, not declarative
   registry entries.** Unlike every other `@boss/registries` registry
   (plain data, duplicate-key guard), `createTaskHandlerRegistry()` in
   `packages/loop/src/taskHandlerRegistry.ts` stores executable
   `(input) => Promise<{ output, errorMessage }>` functions in a `Map`.
   Loop never knows what a handler does internally — only its
   input/output contract — so business logic (e.g. the Tool Fabric
   request flow) stays in `apps/api`'s `loopRuntimeService.ts`, which
   registers a `"tool"` handler wrapping `toolFabricService.requestTool`.
3. **Explicit 11-state machine with an adjacency-map transition guard.**
   `packages/loop/src/stateMachine.ts` encodes
   `pending → queued → running → {waiting, completed, failed, timed_out, cancelled}`
   etc. exactly per the EP-1/Goal-7 state list. `assertTransition()` throws
   `InvalidStateTransitionError` on any disallowed transition; this guards
   the runtime's pending→queued→running bootstrap explicitly, while
   later state writes proceed through `ports.*.updateState()` directly.
4. **Sequential execution only, with retry, dead-letter, and
   compensation-based rollback — no scheduler yet.**
   `createLoopRuntime(ports, handlers, eventBus).execute()` runs each
   `StepSpec` in order, retries up to `step.maxRetries` (default 0) on
   handler failure, writes a `DeadLetterEntry` when retries are exhausted,
   and on any step failure calls each previously-completed step's
   `compensationTaskType` handler in reverse order before marking the
   whole `WorkflowExecution` `"failed"`. There is no immediate/scheduled/
   recurring scheduler, no timeout enforcement, and no parallel or
   conditional branching — this is tracked as tech debt, not silently
   dropped.
5. **Dual-channel event emission: durable audit log + live pub/sub.**
   The `emit()` helper in `runtime.ts` both appends an
   `ExecutionEventRecord` via `ExecutionEventPort` (the durable record) and
   publishes the same event to the injected `EventBus`. `packages/events`
   previously only had the `EventBus` interface with no implementation;
   `createInMemoryEventBus()` (new) is a synchronous `Map`-based pub/sub
   used as the default in `apps/api`.

## Consequences

- New `@boss/types` ontology additions: `ExecutionState`, `TaskType`,
  `WorkflowExecution`, `TaskExecution`, `ExecutionEventRecord`,
  `DeadLetterEntry`. `ExecutionEventRecord` extends `TenantScoped` only
  (append-only, no `deleted_at`); the other three extend `TenantScoped` and
  `Timestamped`.
- `packages/db/migrations/0010_loop_runtime.sql` creates
  `workflow_executions`, `task_executions`, `execution_events`,
  `dead_letter_queue` — applied and validated against live local Postgres
  (`boss_dev`).
- Dual Postgres + in-memory repositories added for all four new ports,
  wired into `apps/api/src/container.ts`'s `RepositoryContainer`.
- `apps/api/src/services/loopRuntimeService.ts` composes the runtime with
  concrete handlers: `"tool"` delegates to `toolFabricService.requestTool`;
  `"ai"`, `"manual"`, `"scheduled"` are explicit not-implemented stubs
  returning an `errorMessage` (no AI Employee runtime exists yet — that is
  Batch 6, sequenced after this).
- Fixed a pre-existing circular import in `packages/events` (`index.ts` ↔
  `inMemoryEventBus.ts`) by extracting the `BossEvent`/`EventBus`
  interfaces into `eventBus.ts`.
- Explicitly NOT implemented in this slice: real scheduler (immediate is
  the only mode; no scheduled/recurring/business-hours-aware execution),
  timeout enforcement (the `timed_out` state exists in the machine but
  nothing transitions into it yet), parallel/conditional step execution
  (sequential only), separate metrics/logs tables (state is tracked via
  `ExecutionEventRecord` + the current `state` field only). Logged as new
  tech debt entries rather than claimed as done.

## Alternatives Considered

- Giving `packages/loop` a direct `@boss/db` dependency for convenience:
  rejected — would violate the same separation-of-concerns principle Law 1
  enforces one level up; ports keep Loop persistence-agnostic and testable
  with an in-memory adapter with zero behavior difference.
- Reusing the data-only `createRegistry<TEntry>()` factory for task
  handlers: rejected — handlers are executable code, not declarative
  metadata, and forcing them through the registry's duplicate-key-throws
  semantics would conflate "static capability declaration" with "runtime
  behavior wiring," which are different concerns with different lifecycles.
- Building the scheduler now, before any caller exists that needs anything
  beyond immediate execution: rejected — no Batch 5/6 caller has been
  built yet, so a scheduler would be premature; immediate execution is
  the only mode actually required to unblock the next batch.
