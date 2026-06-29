# ADR-0009: Autonomous Workflow Generator — recommendations to executable Loop Runtime graphs

**Status:** accepted
**Date:** 2026-06-29

## Context

Goal 10 required transforming an approved `BusinessRecommendation` into an
executable Loop Runtime workflow automatically, with no manual step in
between. The Loop Runtime (ADR-0007) already accepts a flat `StepSpec[]`
graph and executes it; the MCP intelligence layer (Law 1) already produces
`BusinessRecommendation` entries with a `relatedCapabilities: string[]`
field, but nothing turned one into the other, and nothing auto-triggered
execution when a recommendation was approved.

`WorkflowDefinitionEntry` (the existing workflow registry type) was checked
and confirmed to be metadata-only — `description`, `triggerType`,
`relatedConstraints`, `relatedKpis` — with no `steps` field, and the seeded
`general-smb` workflows have no executable graph either. There was nothing
to reuse as a template mechanism.

## Decisions

1. **MCP generates the graph; Loop never sees MCP's types.** A new
   `generateWorkflowGraph()` lives in `packages/mcp/src/intelligence/workflowGenerator.ts`.
   It must not import `StepSpec` from `@boss/loop` (architectural rule
   `mcp-never-imports-loop`), so it defines its own structurally identical
   `GeneratedWorkflowStep`/`GeneratedWorkflowGraph` interfaces. Because
   TypeScript uses structural typing, `apps/api` can pass the generated
   steps directly into `loopRuntime.execute(..., steps: StepSpec[])` with no
   adapter or cast. MCP still only ever produces declarative data — it never
   touches Loop's types, runtime, or execution.
2. **One "tool" step per related capability, derived directly from
   `relatedCapabilities`.** No new template/registry layer was introduced.
   Building a speculative workflow-template registry before any consumer
   needed more than "one step per capability" would have been premature
   abstraction; the existing field already expresses exactly what needs to
   run.
3. **`workflowGenerationService` (apps/api) is the orchestration seam.**
   It looks up the recommendation, calls `generateWorkflowGraph()`, appends
   a `workflow_generated` timeline entry, publishes `workflow.generated`,
   calls `loopRuntime.execute()`, then publishes `workflow.<state>`
   (`workflow.completed` / `workflow.failed`) using the canonical
   `{context}.{entity}.{verb}` convention.
4. **Auto-trigger via the existing event backbone, not a new mechanism.**
   `apps/api/src/index.ts` subscribes to `business.recommendation.approved`
   (already published per ADR-0008) and calls
   `workflowGeneration.generateAndExecute()`. Approval and execution are
   fully decoupled — `businessRecommendationService` has no knowledge that
   approval triggers a workflow.
5. **`TimelineEventType` gained `"workflow_generated"`.** It is a closed
   string-literal union, so the new audit entry required extending it
   rather than relying on an open string type.
6. **Hardened `loopRuntimeService.ts`'s `"tool"` handler to never throw.**
   `packages/loop/src/runtime.ts`'s `runStep()` calls `await handler(...)`
   with no surrounding try/catch — handlers are contractually required to
   always resolve to `{ output, errorMessage }`. The existing `"tool"`
   handler called `toolFabric.requestTool()` directly, which can throw
   `CapabilityNotFoundError` synchronously when a capability key doesn't
   resolve to a registered tool. This was a latent robustness gap (not
   specific to this feature) that became reachable now that workflow steps
   are generated programmatically rather than hand-written. Wrapped the call
   in try/catch so capability resolution failures gracefully fail one step
   instead of crashing the whole `execute()` call.

## Consequences

- `relatedCapabilities` entries are not guaranteed to map 1:1 onto
  registered tool capabilities (some are category-like labels). Generated
  steps for unresolvable capabilities will deterministically fail at
  execution time with a clear `errorMessage`, rather than crashing the
  workflow — tracked as tech debt rather than blocking Goal 10.
- Any future "tool"-type step, regardless of origin, is now protected from
  capability-resolution exceptions.

## Alternatives considered

- A new workflow-template registry mapping `definitionKey` → step graph.
  Rejected: no current data shows recommendations need anything beyond
  "one tool step per related capability"; the registry would have no real
  content to seed beyond what `relatedCapabilities` already expresses.
