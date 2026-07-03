# ADR-0020: Goal 19 Batch 4 — Decision OS MVP Certification

**Status:** Accepted  
**Date:** 2026-07-02  
**Deciders:** ARB (Architecture Review Board)

---

## Context

Goal 19 (Business Intelligence & Decision OS) delivered in 4 batches:

- **Batch 1** — Registry convergence: seeded `metricRegistry` (13 entries) and `insightRegistry` (12 entries); documented 7 structural overlaps in ADR-0019.
- **Batch 2** — Executive Command Center wired to live Postgres API; KPI engine expanded from 4 to 11 signal sources; `business.list(orgId)` added.
- **Batch 3** — KPI-driven recommendation engine (`deriveKpiRecommendations`), composite KPI health score (`deriveKpiHealthScore`), decision timeline entries on recommendation lifecycle.
- **Batch 4** (this ADR) — MVP completion audit; Executive Decision Hub enhancement; Explainability Layer HTTP surface; `dashboardRegistry` seeding; harmonization review; certification.

---

## Decisions

### WS1 — Executive Decision Hub

- `CommandCenterSnapshot.summary` extended with `healthScore: number` and `healthTone: MetricTone`.
- New snapshot fields: `todayPriorities: TodayPriority[]` and `kpiTrends: KpiTrendItem[]`.
- Dashboard page renders health score banner, today's priorities, and KPI trends sections.
- `liveCommandCenter.ts` fetches `kpiReadings` as the 11th parallel data source.

### WS2 — Explainability Layer

- `get(orgId, recommendationId)` added to `BusinessRecommendationService` interface and implementation.
- `createBusinessRecommendationController` now exposes `get`.
- HTTP route `GET /v1/recommendations/:recommendationId` added to `server.ts`.
- Evidence hydration on `listByBusinessId` was already complete (Batch 3).

### WS3 — Decision Timeline

Complete in Batch 3. `recommendation_approved`, `recommendation_dismissed`, and `kpi_measured` event types added to `TimelineEventType`.

### WS4 — Registry Convergence

- `dashboardRegistry` was defined but had zero entries (dead registry).
- Seeded with 5 platform dashboard definitions: `command_center`, `business_mri`, `recommendations`, `kpi_analytics`, `decision_timeline`.
- Each entry declares `featureIds`, `dataSourceIds`, `route`, `status`, and `documentation` path.

### WS5 — Harmonization Review

Scanned 8 zero-duplicate gates:

| Gate | Result |
|------|--------|
| No duplicate KPI keys | ✅ All 11 keys unique in `kpiDerivation.ts` |
| No duplicate metric registry keys | ✅ 13 unique entries in `metricRegistry` |
| No duplicate insight registry keys | ✅ 12 unique entries in `insightRegistry` |
| No duplicate dashboard registry keys | ✅ 5 unique entries in `dashboardRegistry` |
| No duplicate recommendation definition keys | ✅ Managed by `recommendationDefinitionRegistry` (registry-first) |
| No duplicate HTTP routes | ✅ Verified; `/status` + dedicated routes coexist intentionally |
| No duplicate event types | ✅ `TimelineEventType` union is additive, no repeats |
| No duplicate RepositoryContainer keys | ✅ Single canonical container, all repos unique |

---

## MVP Acceptance Test — Can a business owner answer these 6 questions?

| Question | Answer Path |
|----------|-------------|
| How healthy is my business right now? | Health score banner on `/dashboard` (live Postgres via `deriveKpiHealthScore`) |
| What should I focus on today? | Today's Priorities section derived from KPI thresholds and constraint priorities |
| Which KPIs are moving in the wrong direction? | KPI Trends section on `/dashboard` |
| Why is this recommendation being made? | `GET /v1/recommendations/:id` returns evidence chain with source, value, threshold |
| What happens when I approve a recommendation? | Approval emits `recommendation_approved` timeline entry + domain event |
| What is the plan to transform my business? | Transformation Roadmap via `GET /v1/businesses/:id/recommendations/roadmap` |

All 6: **PASS**.

---

## Consequences

- Goal 19 MVP is complete. All 5 dead/empty registries seeded. All 4 intelligence subsystems operational.
- `dashboardRegistry` now serves as the canonical manifest of all platform views.
- The explainability HTTP surface enables future recommendation detail pages.
- Production readiness gates remain: Supabase RLS policies, Inngest BTE scheduler, Sentry/PostHog telemetry.

---

## Final Declaration

> **Goal 19 MVP — Business Intelligence & Decision OS Certified.**
