# Goal 21 — Gap Analysis

**Date:** 2026-06-30

## Confirmed Gaps (9 gaps — all additive)

### G1: Planning Engine (MCP)
**Gap:** No module translates a `BusinessDecision` into an executable plan with milestones, tasks, owners, dependencies, success metrics, and rollback strategy.
**Why not reuse existing?** `workflowGenerator.ts` generates workflow step graphs from recommendations, not decision-level plans with milestones. `multiAgentPlanner.ts` plans agent delegation, not business execution plans.
**Solution:** `packages/mcp/src/intelligence/planningEngine.ts` — pure deterministic derivation from decision fields.

### G2: Verification Engine (MCP)
**Gap:** No module compares pre/post KPI readings to verify if an outcome was achieved.
**Why not reuse existing?** `decisionOptimization.ts` analyzes decision *patterns* over time. `evaluateDecisionHealth()` evaluates a decision before execution. Neither computes a post-execution KPI delta or SLA compliance check.
**Solution:** `packages/mcp/src/intelligence/verificationEngine.ts` — deterministic KPI delta + ROI + SLA check.

### G3: Business Operating Loop Service (API)
**Gap:** No single service orchestrates the complete Observe→Learn cycle as one resumable, idempotent unit.
**Why not reuse existing?** Individual services exist for each step, but nothing sequences them into one loop with state tracking and event emission.
**Solution:** `apps/api/src/services/businessOperatingLoopService.ts` — pure orchestration, zero intelligence.

### G4: Execution Plan Service (API)
**Gap:** No service wraps the Planning Engine for API use, stores plans, and emits `business.plan.created`.
**Solution:** `apps/api/src/services/executionPlanService.ts` — thin orchestration layer using `MemoryRecordRepository` for plan persistence.

### G5: Outcome Verification Service (API)
**Gap:** No service wraps the Verification Engine, persists verification results, and emits `business.outcome.verified` + `business.learning.recorded`.
**Solution:** `apps/api/src/services/outcomeVerificationService.ts` — reads existing repos, calls MCP, emits events.

### G6: 5 New Registries
**Gap:** No registry metadata for loop configs, plan templates, verification rules, optimization signals, or learning patterns.
**Solution:** 5 new registries in `packages/registries/src/registries/` + seeded via general-smb pack.

### G7: 7 New Domain Events
**Gap:** No domain events for plan.created, execution.started, execution.completed, outcome.verified, learning.recorded, optimization.generated, loop.completed.
**Solution:** Additive events emitted through existing DurableEventBus in new services.

### G8: Executive Operating Center (API + Mission Control extension)
**Gap:** No unified view showing all loop state (health + decisions + plans + verification + learning + optimization) in one snapshot.
**Solution:** Extend `MissionControlService.getSnapshot()` with `loopState` field; or add `ExecutiveOperatingCenterService` as thin assembler over existing services. Chosen: thin new service to avoid polluting Mission Control further.

### G9: New HTTP Routes
**Gap:** No routes for loop execution, plan retrieval, outcome verification, or executive center.
**Solution:** Additive routes in `apps/api/src/http/server.ts`.

## Non-Gaps (Explicitly Confirmed)

| Claimed Gap | Reality | Verdict |
|-------------|---------|---------|
| "No workflow engine" | LoopRuntimeService + WorkflowGenerationService fully functional | NOT A GAP |
| "No scheduler" | SchedulerService + computeNextCronRun() + recoverFailed() fully functional | NOT A GAP |
| "No memory system" | MemoryRecordRepository.upsert() + businessDecision.measure() | NOT A GAP |
| "No approval engine" | 9-state decision lifecycle + requireRole() | NOT A GAP |
| "No learning loop" | decision.measure() already persists to memoryRecords | NOT A GAP |
| "No event bus" | DurableEventBus fully functional | NOT A GAP |
| "No KPI engine" | kpiMeasurementService + deriveKpiReadings() | NOT A GAP |
| "No recommendation engine" | recommendationEngine.ts + businessRecommendationService | NOT A GAP |
| "No forecasting" | scenarioEngine.ts (6 types, 4 periods) | NOT A GAP |
