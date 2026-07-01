# Goal 21 — Autonomous Business Operating Loop: Harmonization Audit

**Date:** 2026-06-30
**Examiner:** Claude (Sonnet 4.6)
**Decision Rule:** Reuse ≥80% · Extend 30–80% · Merge duplicates · Replace <30% · Deprecate if superseded · Unchanged if orthogonal

---

## Executive Finding

Goal 21 requires the **orchestration layer** that sequences all existing systems into one closed loop.
The loop itself (Observe→Analyze→Decide→Plan→Execute→Verify→Learn→Improve) is the only new thing.
Individual steps are already implemented: every observation, analysis, decision, and execution primitive
exists. Three targeted MCP modules are missing (Planning Engine, Verification Engine, Optimization
extensions) plus 5 new registries.

**Existing platform coverage: ~80%. New code: ~20% — all additive.**

---

## Full System Audit

### Universal Capability Runtime (UCR)
| Component | Status | Verdict |
|-----------|--------|---------|
| `LoopRuntimeService` | `apps/api/src/services/loopRuntimeService.ts` | **REUSE** — executes workflow steps |
| `WorkflowGenerationService.generateAndExecute()` | same + `workflowGenerationService.ts` | **REUSE** — generates + executes from recommendation |
| `MultiAgentRuntimeService.delegateTask()` | `multiAgentRuntimeService.ts` | **REUSE** — plan/execute/reflect for agent tasks |

### Execution OS / Scheduler
| Component | Status | Verdict |
|-----------|--------|---------|
| `SchedulerService` | `schedulerService.ts` | **REUSE** — cron/delayed/immediate job scheduling |
| `computeNextCronRun()` | `@boss/mcp` | **REUSE** — next run calculation |
| `recoverFailed()` | scheduler service | **REUSE** — exponential backoff recovery |

### DurableEventBus
| Component | Status | Verdict |
|-----------|--------|---------|
| `DurableEventBus` | `packages/events/src/durableEventBus.ts` | **REUSE** — sole event backbone |
| `EventLogRepository` | `packages/db` | **REUSE** — sole durable log |
| Domain events (decision.*, workflow.*, scenario.*, kpi.*) | across services | **REUSE** |
| 7 new Goal 21 events | MISSING | **EXTEND** — additive only |

### MCP Intelligence
| Module | File | Verdict |
|--------|------|---------|
| `generateDecision()` | `decisionEngine.ts` | **REUSE** |
| `evaluateDecisionHealth()` | same | **REUSE** |
| `optimizeDecisions()` + `prioritizeDecisions()` | `decisionOptimization.ts` | **EXTEND** — add workflow efficiency signals |
| `generateExecutiveBrief()` | `executiveBrief.ts` | **REUSE** |
| `generateRecommendations()` | `recommendationEngine.ts` | **REUSE** |
| `detectConstraints()` | `constraintEngine.ts` | **REUSE** |
| `analyzeRootCauses()` | `rootCauseEngine.ts` (Goal 20) | **REUSE** |
| `deriveKpiReadings()` | `kpiDerivation.ts` (Goal 19) | **REUSE** |
| `deriveBusinessHealth()` | `businessHealth.ts` | **REUSE** |
| `calculateScenario()` / `generateForecast()` | `scenarioEngine.ts` | **REUSE** |
| `planMultiAgentTask()` / `reflectOnOutcomes()` | `multiAgentPlanner.ts` + `multiAgentReflection.ts` | **REUSE** |
| `generateWorkflowGraph()` | `workflowGenerator.ts` | **REUSE** |
| **Planning Engine** | MISSING | **NEW** — translate decisions → milestones/tasks/owners |
| **Verification Engine** | MISSING | **NEW** — verify KPI delta, ROI, SLA post-execution |
| **Optimization Engine extensions** | MISSING signals | **EXTEND** decisionOptimization |

### Decision OS (Goals 21–23 naming in original)
| Component | Status | Verdict |
|-----------|--------|---------|
| `BusinessDecisionService` (9-state lifecycle) | `businessDecisionService.ts` | **REUSE** |
| `measure()` with memory persistence | same | **REUSE** — learning loop already exists |
| `getOptimizationReport()` | same | **REUSE** |
| `getPriorityRanking()` | same | **REUSE** |

### KPI Measurement
| Component | Status | Verdict |
|-----------|--------|---------|
| `KpiMeasurementService` | `kpiMeasurementService.ts` (Goal 19) | **REUSE** |
| `deriveKpiReadings()` | `kpiDerivation.ts` | **REUSE** |
| KPI Registry (11 entries) | `kpiRegistry` | **REUSE** |

### Registries (24 existing post Goals 19–20)
| Registry | Verdict |
|----------|---------|
| All 24 existing registries | **REUSE** — no changes |
| `operatingLoopRegistry` | **NEW** — loop config and schedules |
| `planningRegistry` | **NEW** — plan templates and milestone frameworks |
| `verificationRegistry` | **NEW** — outcome measurement rules |
| `optimizationRegistry` | **NEW** — optimization signal definitions |
| `learningRegistry` | **NEW** — learning pattern definitions |

### Memory / Reflection
| Component | Status | Verdict |
|-----------|--------|---------|
| `MemoryRecordRepository.upsert()` | `packages/db` | **REUSE** — stores key/value per business |
| Decision measurement → memoryRecords | `businessDecisionService.measure()` | **REUSE** — learning already persisted |
| `reflectOnOutcomes()` | `multiAgentReflection.ts` | **REUSE** — agent reflection |
| `optimizeDecisions()` learningInsights | `decisionOptimization.ts` | **REUSE** |

### Evidence
| Component | Status | Verdict |
|-----------|--------|---------|
| `EventLogRepository` | `packages/db` | **REUSE** — durable evidence record |
| Constraint evidence items | `BusinessConstraint.evidence[]` | **REUSE** |
| Recommendation evidence | `BusinessRecommendation.evidence[]` | **REUSE** |
| Decision supporting evidence | `BusinessDecision.supportingConstraintIds/RecommendationIds` | **REUSE** |

### Approval Engine
| Component | Status | Verdict |
|-----------|--------|---------|
| `businessDecisionService.approve()` | existing | **REUSE** |
| RBAC `requireRole()` | `http/auth.ts` | **REUSE** |
| `business.decision.approved` event | existing | **REUSE** |

### Notification / Integration
| Component | Status | Verdict |
|-----------|--------|---------|
| `ToolFabricService` — Twilio, Gmail, Slack, SendGrid | existing | **REUSE** |
| Provider adapters (8 real HTTP) | existing | **REUSE** |

### Goals / Business Health
| Component | Status | Verdict |
|-----------|--------|---------|
| `BusinessHealthService` | existing | **REUSE** |
| `goalOptionRegistry` | `packages/registries` | **REUSE** |
| `missionControlService.getSnapshot()` | existing | **EXTEND** — add loop state |

---

## Gap Summary

| # | Gap | Action |
|---|-----|--------|
| G1 | No Planning Engine (decision → milestones/tasks) | **NEW** `packages/mcp/src/intelligence/planningEngine.ts` |
| G2 | No Verification Engine (KPI delta, ROI, SLA) | **NEW** `packages/mcp/src/intelligence/verificationEngine.ts` |
| G3 | No orchestrating loop service | **NEW** `apps/api/src/services/businessOperatingLoopService.ts` |
| G4 | No execution plan service (stores plans in memoryRecords) | **NEW** `apps/api/src/services/executionPlanService.ts` |
| G5 | No outcome verification service | **NEW** `apps/api/src/services/outcomeVerificationService.ts` |
| G6 | No operating loop registries (5 registries) | **NEW** in packages/registries |
| G7 | No Goal 21 domain events (7 events) | **EXTEND** DurableEventBus (additive) |
| G8 | No Executive Operating Center (unified snapshot) | **EXTEND** missionControlService |
| G9 | No loop HTTP routes | **EXTEND** server.ts |

---

## What Is NOT Built (Duplicate Prevention)

- No new event bus — DurableEventBus handles all 7 new events
- No new workflow engine — LoopRuntimeService + WorkflowGenerationService handle all execution
- No new KPI engine — kpiMeasurementService + deriveKpiReadings() handle all KPI work
- No new memory system — MemoryRecordRepository + business decision measure() handle all learning
- No new approval system — existing 9-state decision lifecycle + requireRole() handle all approvals
- No new analytics pipeline — EventLog + ObservabilityService handle all telemetry
- No new agent system — MultiAgentRuntimeService handles all agent delegation
