# RC1.5 Integration Matrix

**Date:** 2026-07-03  
**Status:** VERIFIED

---

## Boundary Map

```
┌─────────────────────────────────────┐
│           MCP (Intelligence)         │
│  - generateDecision()               │
│  - generateRecommendations()        │
│  - generateHealthScore()            │
│  - detectConstraints()              │
│  - generateExecutiveBrief()         │
│                                     │
│  NEVER calls Loop                   │
│  NEVER writes to DB directly        │
│  NEVER reads from repositories      │
└──────────────┬──────────────────────┘
               │ pure functions / data contracts
               ▼
┌─────────────────────────────────────┐
│          API Services Layer         │
│  - businessHealthService            │
│  - businessConstraintService        │
│  - businessRecommendationService    │
│  - businessDecisionService          │
│  - loopRuntimeService               │
│  - schedulerService                 │
│                                     │
│  Receives repos via container       │
│  Calls MCP functions for logic      │
│  Calls Loop for execution           │
│  Publishes events via eventBus      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Loop Runtime (Execution)    │
│  - execute(orgId, bizId, wf, steps) │
│  - ToolFabric (requestTool)         │
│                                     │
│  NEVER calls MCP                    │
│  NEVER contains business logic      │
│  Gets all intelligence at runtime   │
│    from step definitions            │
└─────────────────────────────────────┘
```

---

## Cross-System Call Matrix

| Caller | Callee | Allowed? | Method |
|--------|--------|----------|--------|
| MCP | Loop | NO | — |
| Loop | MCP | NO | — |
| API Service | MCP | YES | Function import |
| API Service | Loop | YES | `loopRuntimeService.execute()` |
| API Service | Repository | YES | Via container injection |
| API Route | Repository | NO | Must go through service |
| API Route | Service | YES | Injected at startup |
| Service | ToolFabric | YES | Via `toolFabricService` only |
| Service | Provider Adapter | NO | Must go through ToolFabric |

---

## Verified Violations: NONE

Static analysis run against all TypeScript source files confirms:
- `packages/mcp/src/**` — 0 imports of `@boss/loop` or `apps/loop`
- `apps/loop/src/**` — 0 imports of `@boss/mcp` or `packages/mcp`
- `apps/api/src/services/**` — 0 direct Supabase client imports
- `apps/api/src/routes/**` — 0 repository factory instantiations
- `apps/api/src/services/**` — 0 `createInMemoryContainer` calls
- Provider adapter imports outside `toolFabricService` — 0

---

## EventBus Cross-Context Events

| Source Context | Event Type | Consumer Context |
|---------------|------------|-----------------|
| Business | `business.created` | Analytics, Timeline |
| MRI | `business.mri.started` | Analytics |
| MRI | `business.mri.completed` | Health, DNA |
| Health | `business.health.calculated` | BTE, Dashboard |
| Constraints | `business.constraints.analyzed` | Recommendations |
| Recommendations | `business.recommendations.generated` | Decisions |
| Decision | `decision.generated` | Approvals, Workflow |
| Tool | `tool.execution.succeeded` | Evidence, Analytics |
| Tool | `tool.execution.failed` | Dead-letter, Alerting |

All events flow through `EventBus.publish()` — no direct cross-service imports.

---

## Repository Boundary Enforcement

Every repository enforces `orgId` as a mandatory filter parameter. No query path exists that returns data without an `orgId` scope. Verified per in-memory implementations:

| Repository | `orgId` required on read? | `orgId` required on write? |
|-----------|--------------------------|---------------------------|
| BusinessRepository | YES | YES |
| BusinessMriRepository | YES | YES |
| BusinessHealthRepository | YES | YES |
| BusinessConstraintRepository | YES | YES |
| BusinessRecommendationRepository | YES | YES |
| BusinessDecisionRepository | YES | YES |
| WorkflowExecutionRepository | YES | YES |
| TaskExecutionRepository | YES | YES |
| SchedulerJobRepository | YES | YES |
| ToolExecutionRepository | YES | YES |
| DeadLetterRepository | YES | YES |
| EventLogRepository | YES | YES |
| MemoryRecordRepository | YES | YES |
