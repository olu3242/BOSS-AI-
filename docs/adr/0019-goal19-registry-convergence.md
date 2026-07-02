# ADR-0019: Goal 19 Registry Convergence

**Status:** Accepted  
**Date:** 2026-07-02  
**Context:** Goal 19 — Business Intelligence & Decision OS (Batch 1)

---

## Context

A Phase 0 discovery audit of the 49 registry files in `packages/registries/src/registries/` identified seven structural overlaps (OV-1 through OV-7) and two dead registries (zero entries, no consumers). The ARB required these be documented before any new BI infrastructure was added, to prevent further duplication.

---

## Overlaps Identified

### OV-1: KPI Registry vs Metric Registry
**Files:** `kpi.ts`, `metric.ts`  
**Overlap:** Both model performance indicators with `key`, `label`, `description`, `unit`. The KPI registry is the canonical source (seeded by industry packs, consumed by `kpiDerivation.ts`). The metric registry is a superset that adds `aggregation`, `sourceEventTypes`, and an optional `kpiKey` backlink.

**Decision:** Keep both. `kpiRegistry` = business KPI library (what owners track). `metricRegistry` = platform telemetry definitions (how the platform observes those KPIs via events). The `kpiKey` field on `MetricEntry` provides the explicit bridge. Industry packs own `kpiRegistry`; the platform layer owns `metricRegistry`.

### OV-2: Constraint Registry vs Constraint Definition Registry
**Files:** `constraint.ts`, `constraintDefinition.ts`  
**Overlap:** `constraintRegistry` holds named constraint categories (e.g., "cash_flow_constraint"). `constraintDefinitionRegistry` holds structured definitions with severity, remediation, and threshold data.

**Decision:** `constraintDefinitionRegistry` supersedes `constraintRegistry` for all new work. `constraintRegistry` is retained for backwards-compatibility with the 22 references in industry packs. New constraints must be registered in `constraintDefinitionRegistry` only. `constraintRegistry` is frozen — no new entries.

### OV-3: Recommendation Category Registry vs Recommendation Definition Registry
**Files:** `recommendationCategory.ts`, `recommendationDefinition.ts`  
**Overlap:** Same pattern as OV-2. Category is a lightweight label; definition is a full structured record.

**Decision:** `recommendationDefinitionRegistry` is canonical. `recommendationCategoryRegistry` is frozen. Industry packs should only register to `recommendationDefinitionRegistry`.

### OV-4: Insight Registry vs Metric Registry (Actionability)
**Files:** `insight.ts`, `metric.ts`  
**Overlap:** Both can express performance signals. Insights add `severity`, `category`, and `actionable` flags on top of what metrics express.

**Decision:** No change. Metrics = raw measurements. Insights = derived signals with business meaning and severity. The relationship is: metric readings → trigger insight evaluation → produce insight records. Not interchangeable.

### OV-5: Dashboard Registry vs Intelligence Center Registry
**Files:** `dashboard.ts`, `intelligenceCenter.ts`  
**Overlap:** Both define view-layer configurations for displaying business data.

**Decision:** `dashboardRegistry` = end-user dashboard layouts (web app). `intelligenceCenterRegistry` = AI-surfaced intelligence views (briefings, OKRs, alerts). Distinct consumers; keep both. The dashboard command center (WS-2) will wire `dashboardRegistry`. Executive briefings (WS-7) will wire `intelligenceCenterRegistry`.

### OV-6: Goal Option Registry vs Business Query Registry
**Files:** `goalOption.ts`, `businessQuery.ts`  
**Overlap:** Both model things users want to achieve. `goalOptionRegistry` is simple label/category data. `businessQueryRegistry` is semantic query definitions for the graph layer.

**Decision:** `goalOptionRegistry` drives Goal/OKR creation UI (predefined goal types). `businessQueryRegistry` drives the semantic query engine. Different layers; no consolidation needed.

### OV-7: Playbook Registry vs Workflow Registry
**Files:** `playbook.ts`, `workflow.ts`  
**Overlap:** Both reference multi-step process definitions.

**Decision:** `workflowRegistry` = Loop-executable workflow definitions (machine-runnable). `playbookRegistry` = human-readable strategic playbooks (may reference workflows as steps). No merge. The BTE and Loop Runtime consume `workflowRegistry`; the executive briefing and recommendation services consume `playbookRegistry`.

---

## Dead Registry Resolution

| Registry | Prior State | Action |
|---|---|---|
| `metricRegistry` | Defined, zero entries, no consumers | **Seeded** with 13 platform-level metric entries in ADR-0019 implementation |
| `insightRegistry` | Defined, zero entries, no consumers | **Seeded** with 12 platform-level insight entries in ADR-0019 implementation |

---

## Frozen Registries

The following registries are frozen (no new entries, backwards-compatible only):

- `constraintRegistry` — superseded by `constraintDefinitionRegistry`
- `recommendationCategoryRegistry` — superseded by `recommendationDefinitionRegistry`

---

## Constitutional Principles Reinforced

1. **Registry-first:** All intelligence keys must be declared in a registry before use in services or MCP logic.
2. **No silent duplicates:** Every overlap is now documented. Future engineers must consult this ADR before creating a new registry.
3. **Additive only:** No existing registries were deleted. All changes are backwards-compatible.
4. **Evidence-first:** `metricRegistry` entries include `sourceEventTypes` to make evidence chains explicit.

---

## Consequences

- `metricRegistry` and `insightRegistry` are now live platform infrastructure with 25 registered entries.
- Executive briefings (WS-7) can now reference insight registry entries for structured alerting.
- The platform `kpiDerivation.ts` mapping is explicitly cross-referenced via `MetricEntry.kpiKey`.
- OV-2 and OV-3 establish a freeze policy that prevents further category/definition splits.
