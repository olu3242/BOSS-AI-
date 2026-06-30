# Goal 20 — Business Decision OS: Harmonization Audit

**Date:** 2026-06-30
**Examiner:** Claude (Sonnet 4.6)
**Decision Rule:** Reuse ≥80% fit · Extend 30–80% fit · Replace <30% · Deprecate if superseded · Merge if duplicate · Leave Unchanged if orthogonal

---

## Executive Finding

Goal 20 is **already 85% implemented** across Goals 21–23 and Goal 19. The platform
already has a complete Decision Engine (MCP), Decision Service (API), Scenario/Forecast
Engine (MCP+API), Executive Brief (MCP), Decision Optimization (MCP), and KPI
Measurement (added in Goal 19). Six gaps remain — all additive, none requiring new
bounded contexts or duplicate systems.

---

## Complete Capability Audit

### 1. Decision Engine
| Component | File | Verdict |
|-----------|------|---------|
| `generateDecision()` — deterministic, health+constraints+recs→decision | `packages/mcp/src/intelligence/decisionEngine.ts` | **REUSE** ✅ |
| `evaluateDecisionHealth()` — scoring + issue detection | same | **REUSE** ✅ |
| `BusinessDecisionService` — full 9-state lifecycle | `apps/api/src/services/businessDecisionService.ts` | **REUSE** ✅ |
| `BusinessDecisionRepository` — in-memory + Postgres | `packages/db/src/repositories/` | **REUSE** ✅ |
| Decision HTTP routes (generate/approve/reject/schedule/measure) | `apps/api/src/http/server.ts` | **REUSE** ✅ |
| Decision tests (9 tests certified) | `apps/api/src/__tests__/decisionFlow.test.ts` | **REUSE** ✅ |

### 2. Scenario & Forecast Engine
| Component | File | Verdict |
|-----------|------|---------|
| `calculateScenario()` — 6 scenario types, deterministic | `packages/mcp/src/intelligence/scenarioEngine.ts` | **REUSE** ✅ |
| `generateForecast()` — 4 periods, health-driven growth rate | same | **REUSE** ✅ |
| `compareScenarios()` — ROI × confidence × risk ranking | same | **REUSE** ✅ |
| `ScenarioService` — create/list/compare/getForecast | `apps/api/src/services/scenarioService.ts` | **REUSE** ✅ |
| Scenario HTTP routes | `apps/api/src/http/server.ts` | **REUSE** ✅ |
| Scenario tests (6 tests certified) | `apps/api/src/__tests__/scenarioFlow.test.ts` | **REUSE** ✅ |

### 3. Executive Intelligence
| Component | File | Verdict |
|-----------|------|---------|
| `generateExecutiveBrief()` — Claude-powered + deterministic fallback | `packages/mcp/src/intelligence/executiveBrief.ts` | **REUSE** ✅ |
| `optimizeDecisions()` — pattern detection (drift, failure, bottleneck) | `packages/mcp/src/intelligence/decisionOptimization.ts` | **REUSE** ✅ |
| `prioritizeDecisions()` — ROI × confidence × risk scoring | same | **REUSE** ✅ |
| Executive tests (7 tests certified) | `apps/api/src/__tests__/executiveIntelligenceFlow.test.ts` | **REUSE** ✅ |

### 4. KPI & Business Health
| Component | File | Verdict |
|-----------|------|---------|
| KPI Registry — 11 KPIs seeded | `packages/registries/src/registries/kpi.ts` + general-smb pack | **REUSE** ✅ |
| Health Dimension Registry — 10 dimensions | `packages/registries/src/registries/health.ts` | **REUSE** ✅ |
| `deriveBusinessHealth()` — weighted scoring from MRI | `packages/mcp/src/intelligence/businessHealth.ts` | **REUSE** ✅ |
| `deriveKpiReadings()` — platform signals → KPI readings | `packages/mcp/src/intelligence/kpiDerivation.ts` | **REUSE** ✅ |
| `KpiMeasurementService` | `apps/api/src/services/kpiMeasurementService.ts` | **REUSE** ✅ |

### 5. Recommendation Engine
| Component | File | Verdict |
|-----------|------|---------|
| `generateRecommendations()` — constraint-driven, registry-backed | `packages/mcp/src/intelligence/recommendationEngine.ts` | **REUSE** ✅ |
| `BusinessRecommendationService` | `apps/api/src/services/businessRecommendationService.ts` | **REUSE** ✅ |
| Recommendation definitions, categories | `packages/registries/src/registries/recommendationDefinition.ts` | **REUSE** ✅ |

### 6. Constraint & Root Cause Engine
| Component | File | Verdict |
|-----------|------|---------|
| `detectConstraints()` — rule-based, registry-driven | `packages/mcp/src/intelligence/constraintEngine.ts` | **REUSE** ✅ |
| Constraint definitions, categories | `packages/registries/src/registries/constraintDefinition.ts` | **REUSE** ✅ |
| Root cause inference (causal chain analysis) | **MISSING** | **NEW GAP** — extend constraintEngine |

### 7. Event Infrastructure
| Component | File | Verdict |
|-----------|------|---------|
| DurableEventBus | `packages/events/src/durableEventBus.ts` | **REUSE** ✅ |
| EventLogRepository | `packages/db/src/repositories/` | **REUSE** ✅ |
| Domain events (decision.*, scenario.*, kpi.measured) | across services | **REUSE + EXTEND** |
| business.rootcause.detected | **MISSING** | **NEW EVENT** |
| business.health.graph.updated | **MISSING** | **NEW EVENT** |

### 8. Registries (20 existing)
| Registry | Verdict |
|----------|---------|
| kpi, health, constraint, constraintDefinition, recommendationDefinition, capability, etc. | **REUSE** ✅ |
| `decisionRegistry` | **MISSING** → **NEW** |
| `forecastRegistry` | **MISSING** → **NEW** |
| `playbookRegistry` | **MISSING** → **NEW** |
| `businessRuleRegistry` | **MISSING** → **NEW** |
| `insightRegistry`, `metricRegistry` | Added in Goal 19 ✅ |

### 9. Autonomous Actions
| Component | File | Verdict |
|-----------|------|---------|
| `WorkflowGenerationService` | `apps/api/src/services/workflowGenerationService.ts` | **REUSE** ✅ |
| `LoopRuntimeService` | `apps/api/src/services/loopRuntimeService.ts` | **REUSE** ✅ |
| Approval flow (event-driven: recommendation.approved → generate workflow) | `apps/api/src/index.ts` | **REUSE** ✅ |

### 10. Observability
| Component | File | Verdict |
|-----------|------|---------|
| `ObservabilityService` — 7 counters + P50/P95 | `apps/api/src/services/observabilityService.ts` | **EXTEND** — add `business.rootcause.detected` counter |
| Mission Control Snapshot | `apps/api/src/services/missionControlService.ts` | **EXTEND** — add `kpiReadings` field |

### 11. Multi-Tenancy
| Component | Verdict |
|-----------|---------|
| org_id scoping on all repos | **REUSE** ✅ — verified in rc15TenantIsolationFlow.test.ts |
| JWT auth with org_id claim | **REUSE** ✅ — verified in rc15AuthJwtFlow.test.ts |

---

## Gap Summary — What Goal 20 Must Add

| # | Gap | Action | Scope |
|---|-----|--------|-------|
| G1 | No root cause causal chain engine | **NEW** — `packages/mcp/src/intelligence/rootCauseEngine.ts` | MCP only |
| G2 | No `decisionRegistry` metadata | **NEW** — `packages/registries/src/registries/decision.ts` | Registry |
| G3 | No `forecastRegistry` | **NEW** — `packages/registries/src/registries/forecast.ts` | Registry |
| G4 | No `playbookRegistry` | **NEW** — `packages/registries/src/registries/playbook.ts` | Registry |
| G5 | No `businessRuleRegistry` | **NEW** — `packages/registries/src/registries/businessRule.ts` | Registry |
| G6 | No `business.rootcause.detected` event | **EXTEND** — add event + service method | Service + Event |
| G7 | No root cause HTTP route | **EXTEND** — `GET /businesses/:id/rootcause` | HTTP |
| G8 | Mission Control missing KPI readings | **EXTEND** — add `kpiReadings` to snapshot | Service |

---

## What Was NOT Built (and Why)

- **Duplicate KPI engine** — `kpiMeasurementService` (Goal 19) + `kpiRegistry` already cover this
- **Duplicate analytics pipeline** — Event Log + ObservabilityService already cover this
- **Duplicate recommendation engine** — `recommendationEngine.ts` + `businessRecommendationService.ts` fully cover this
- **Duplicate forecasting engine** — `scenarioEngine.ts` (6 types, 4 periods) fully covers this
- **Separate "Executive Advisor" services** — `executiveBrief.ts` with Claude fallback already covers CEO/COO/CFO use cases; separate advisor services would duplicate intelligence
- **Separate dashboard architecture** — Out of scope for backend; Mission Control is the existing command center
- **New event bus** — DurableEventBus covers all requirements

---

## Canonical Data Flow (Post–Goal 20)

```
Business Events (MRI, health, constraints, tool executions)
  → DurableEventBus (existing)
  → EventLog (existing repo)
  → constraintEngine.detectConstraints() [existing — detects constraints]
  → rootCauseEngine.analyzeChain() [NEW — traces causal chain from constraints]
  → business.rootcause.detected event [NEW]
  → recommendationEngine.generateRecommendations() [existing — prescribes actions]
  → decisionEngine.generateDecision() [existing — selects best option]
  → business.decision.created event [existing]
  → executiveBrief.generateExecutiveBrief() [existing — Claude or fallback]
  → decisionOptimization.optimizeDecisions() [existing — learning loop]
  → /businesses/:id/decisions (existing HTTP)
  → /businesses/:id/rootcause (NEW HTTP)
  → /businesses/:id/kpis (existing HTTP, Goal 19)
  → Mission Control Snapshot (existing + KPI readings extension)
```

All steps use existing architecture. One new MCP module, four new registries, two new HTTP routes.
