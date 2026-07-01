# RC1.4 — Product Analytics Plan

**Date:** 2026-07-01

---

## Event Taxonomy

All product events are emitted via `ProductAnalyticsService` which wraps the DurableEventBus with a standardized envelope.

### Core Funnel Events

| Event | Trigger | Key Properties |
|-------|---------|----------------|
| `analytics.business.created` | Business profile saved | orgId, businessId, industry, employeeCount |
| `analytics.mri.started` | MRI session begins | orgId, businessId, mriId |
| `analytics.mri.completed` | All sections done | orgId, businessId, mriId, sectionCount, answerCount |
| `analytics.workspace.viewed` | Workspace overview page load | orgId, businessId, section |
| `analytics.kpi.viewed` | KPI section visited | orgId, businessId, kpiCount |
| `analytics.health.generated` | Health score computed | orgId, businessId, overallScore |
| `analytics.recommendation.accepted` | Decision approved | orgId, businessId, decisionId, decisionType, confidenceScore |
| `analytics.recommendation.rejected` | Decision rejected | orgId, businessId, decisionId, reason |
| `analytics.workflow.executed` | Loop workflow runs | orgId, businessId, workflowKey, status |
| `analytics.feedback.submitted` | FeedbackButton used | orgId, category, feedbackId |
| `analytics.nps.submitted` | Post-MRI NPS submitted | orgId, businessId, score, comment |
| `analytics.integration.connected` | Integration linked | orgId, businessId, providerKey |

### Activation Metric

A business is **activated** when:
1. MRI completed ✅
2. Workspace viewed ✅
3. At least one decision approved ✅

### Retention Metrics

| Metric | Definition | Target (Beta) |
|--------|-----------|---------------|
| WAB | Businesses with ≥1 workspace view in last 7 days | > 60% |
| MAB | Businesses with ≥1 workspace view in last 30 days | > 80% |
| Decision adoption rate | Decisions approved / decisions generated | > 40% |
| MRI completion rate | MRIs completed / started | > 85% |
| Feature depth | Avg sections used per business | > 3 |

---

## Implementation

`ProductAnalyticsService` is a thin wrapper:
- Takes structured `AnalyticsEvent` input
- Enriches with `recordedAt` timestamp
- Publishes to `DurableEventBus` with `analytics.*` prefix
- Events persist in `event_log` table and are queryable by CS workspace

Events are also wired into existing service hooks:
- `BusinessProfileService.create()` → `analytics.business.created`
- `BusinessMriService.complete()` → `analytics.mri.completed`
- `BusinessDecisionService.approve()` → `analytics.recommendation.accepted`
- `BusinessDecisionService.reject()` → `analytics.recommendation.rejected`
- `BusinessDecisionService.generate()` → internal workflow event
- `SupportService.submitFeedback()` → `analytics.feedback.submitted`
