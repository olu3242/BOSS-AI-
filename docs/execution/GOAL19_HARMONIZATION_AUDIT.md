# Goal 19 — Workstream 0: Platform Harmonization Audit

**Date:** 2026-06-30
**Examiner:** Claude (claude-sonnet-4-6)
**Decision Rule:** Reuse ≥80% fit · Extend 30–80% fit · Replace <30% fit (with justification)

---

## Executive Summary

Goal 19 (Business Intelligence & Decision OS) does NOT require a new analytics
pipeline, a new KPI engine, or a new dashboard framework. The platform already
owns all foundational capabilities. This audit identifies four gaps that are
filled via **extension** — no replacements, no duplicates.

---

## Existing Capabilities — Reuse / Extend / Replace Verdicts

### Analytics & KPIs

| Capability | Location | Fit | Verdict |
|-----------|----------|-----|---------|
| KPI Registry (11 KPIs seeded) | `packages/registries/src/registries/kpi.ts` + `industry-packs/general-smb` | 95% | **REUSE** — all 11 KPIs are canonical; new measurement service reads from this registry |
| Health Dimension Registry (10 dimensions) | `packages/registries/src/registries/health.ts` | 90% | **REUSE** — dimensions are the per-axis breakdown of Business Health Score |
| Business Health derivation | `packages/mcp/src/intelligence/businessHealth.ts` | 85% | **REUSE** — already produces `overallScore` and 9 dimension scores from MRI responses |
| Observability counters (7 domain events) | `apps/api/src/services/observabilityService.ts` | 60% | **EXTEND** — add `business.kpi.measured` subscription to counter |
| Scenario / Forecast engine | `apps/api/src/services/scenarioService.ts` + `packages/mcp/src/intelligence/scenarioEngine.ts` | 90% | **REUSE** — already provides forecast and scenario comparison |

### Decision Intelligence

| Capability | Location | Fit | Verdict |
|-----------|----------|-----|---------|
| Decision Engine | `packages/mcp/src/intelligence/decisionEngine.ts` | 95% | **REUSE** |
| Decision Service | `apps/api/src/services/businessDecisionService.ts` | 95% | **REUSE** |
| Decision Optimization | `packages/mcp/src/intelligence/decisionOptimization.ts` | 90% | **REUSE** |
| Executive Brief | `packages/mcp/src/intelligence/executiveBrief.ts` | 90% | **REUSE** |
| Recommendation Engine | `packages/mcp/src/intelligence/recommendationEngine.ts` | 90% | **REUSE** |

### Event Pipeline

| Capability | Location | Fit | Verdict |
|-----------|----------|-----|---------|
| Durable Event Bus | `packages/events/src/durableEventBus.ts` | 100% | **REUSE** — all new events published through existing bus |
| Event Log Repository | `packages/db` | 100% | **REUSE** — KPI measurement derives counts from existing event log |
| Domain event schema | `packages/registries/src/registries/event.ts` | 100% | **REUSE** — `business.kpi.measured` added as new event type |

### Mission Control & Projections

| Capability | Location | Fit | Verdict |
|-----------|----------|-----|---------|
| Mission Control Service | `apps/api/src/services/missionControlService.ts` | 70% | **EXTEND** — add `kpiReadings` field to `MissionControlSnapshot` (post-Goal-19) |
| Business Timeline | `apps/api/src/services/businessTimelineService.ts` | 90% | **REUSE** |

### Registries

| Capability | Location | Fit | Verdict |
|-----------|----------|-----|---------|
| 20 existing registries | `packages/registries/src/registries/` | Varies | **REUSE all** — see individual rows above |
| Insight Registry | **MISSING** | N/A | **NEW** — fills gap: no registry for platform-level insight definitions |
| Metric Registry | **MISSING** | N/A | **NEW** — fills gap: no registry linking event types to measurable metrics |

### MCP Intelligence

| Capability | Location | Fit | Verdict |
|-----------|----------|-----|---------|
| 16 existing intelligence modules | `packages/mcp/src/intelligence/` | Varies | **REUSE all** — see rows above |
| KPI Derivation | **MISSING** | N/A | **NEW** — fills gap: no module maps platform signals → KPI readings |

---

## Gaps Identified → Implementations

| Gap | Implementation | Type | Law Compliance |
|-----|---------------|------|----------------|
| No KPI reading derivation | `packages/mcp/src/intelligence/kpiDerivation.ts` | NEW (MCP) | Law 1 ✅ — intelligence in MCP |
| No KPI measurement service | `apps/api/src/services/kpiMeasurementService.ts` | NEW (API) | Law 1 ✅ — calls MCP derivation; Law 2 ✅ — emits `business.kpi.measured` event |
| No Insight Registry | `packages/registries/src/registries/insight.ts` | NEW (registry) | Registry-first ✅ |
| No Metric Registry | `packages/registries/src/registries/metric.ts` | NEW (registry) | Registry-first ✅ |
| No `/kpis` HTTP route | Added to `apps/api/src/http/server.ts` | EXTEND | API convention ✅ |

---

## Hard Constraints Verification

| Constraint | Status |
|-----------|--------|
| No duplicate analytics pipelines | ✅ — KPI service reads existing event log, does not create a new pipeline |
| No duplicate KPI engines | ✅ — `kpiDerivation.ts` extends the existing health derivation pattern |
| No duplicate dashboard components | ✅ — No new dashboard created; KPI endpoint feeds existing Mission Control UI |
| Zero new bounded contexts | ✅ — All new code lives in existing bounded contexts (Business, Analytics) |
| Event-driven architecture preserved | ✅ — `business.kpi.measured` emitted through existing DurableEventBus |
| Registry-first | ✅ — KPI readings iterate `kpiRegistry.list()` |
| org_id scoped | ✅ — All repo queries scoped by orgId |
| Law 1 preserved | ✅ — KPI derivation logic lives in `@boss/mcp`, not in Loop or API services |
| Law 2 preserved | ✅ — `business.kpi.measured` event emitted with `readingCount` payload |

---

## What Was NOT Built (and Why)

- **Standalone BI dashboard** — Mission Control already provides the command center; a separate BI dashboard would duplicate it without a user need identified.
- **New event bus / analytics projection layer** — The Durable Event Log + ObservabilityService already cover this; projection queries derive directly from existing repos.
- **New AI agent for KPI analysis** — Existing Recommendation Engine + Constraint Engine already own this responsibility; new readings flow as input to those agents via health score.
- **New database tables for KPI storage** — KPI readings are derived on-demand from existing health + event data; persistence can be added when query latency justifies it.

---

## Canonical Analytics Data Flow (Post–Goal 19)

```
Business Event
  → DurableEventBus (existing)
  → EventLog (existing repo)
  → kpiMeasurementService.measure() [new — reads event log + health repo]
  → deriveKpiReadings() [new MCP module — pure derivation]
  → business.kpi.measured event (new domain event)
  → ObservabilityService counter (extend existing)
  → /api/v1/businesses/:id/kpis (new HTTP route)
  → Mission Control snapshot (future extension)
```

No steps bypass the existing event-driven architecture.
