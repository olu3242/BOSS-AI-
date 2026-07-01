# RC1.4 — Product Metrics

**Audience:** Product and Engineering
**Last Updated:** 2026-07-01

---

## North Star Metric

**Activated Businesses per Month**

A business is *activated* when it has: completed MRI + approved ≥1 decision.
This is the single metric that correlates with customer value delivery.

---

## Beta Success Metrics (Day 30)

| Metric | API | Target |
|--------|-----|--------|
| Activation rate | `GET /analytics/activation` | > 70% |
| WAB (weekly active businesses) | `GET /analytics/wab` | > 60% of cohort |
| MAB (monthly active businesses) | `GET /analytics/mab` | > 80% of cohort |
| NPS | Event log `analytics.nps.submitted` | avg ≥ 30 |
| Champion tier % | `GET /cs/health` | > 30% |

---

## Funnel Metrics

| Stage | Event | Conversion Target |
|-------|-------|------------------|
| Invite sent → Business created | `analytics.business.created` | > 90% |
| Business created → MRI started | `analytics.mri.started` | > 85% |
| MRI started → MRI completed | `analytics.mri.completed` | > 85% |
| MRI completed → Workspace viewed | `analytics.workspace.viewed` | > 90% |
| Workspace viewed → Decision approved | `analytics.recommendation.accepted` | > 50% |

---

## Evidence-Based Backlog Inputs

After the beta, use these queries to prioritize the RC1.5 backlog:

1. **Funnel drop-off**: where do customers exit? Fix the biggest drop.
2. **Health score distribution**: if > 25% are critical, what's the common missing signal?
3. **NPS verbatims**: group `comment` field by theme — top 3 themes = top 3 improvements.
4. **Decision adoption**: if `recommendation.accepted` rate < 40%, decisions need better framing.
5. **MRI drop-off**: if `mri.completed` / `mri.started` < 80%, MRI UX needs simplification.

---

## Customer Health Score Model

```
Score = mriCompleted (20) + workspaceViewedRecently (20) + decisionApproved (25) 
        + activeWorkflows (20) + feedbackSubmitted (15)

Tier:   0-39  = critical (same-day CS intervention)
        40-59 = at_risk (48h outreach)
        60-79 = healthy (weekly check-in)
        80-100 = champion (case study candidate)
```

---

## Event Taxonomy (Analytics Events)

All events are stored in `event_log` with `type` matching the pattern below:

| Event | When Fired | Key Properties |
|-------|-----------|----------------|
| `analytics.business.created` | Business profile created | businessId, industry, employeeCount |
| `analytics.mri.started` | MRI session begins | businessId, mriId |
| `analytics.mri.completed` | MRI all sections done | businessId, mriId |
| `analytics.workspace.viewed` | Workspace overview loaded | businessId, section |
| `analytics.kpi.viewed` | KPI section visited | businessId, kpiCount |
| `analytics.health.generated` | Health score computed | businessId, overallScore |
| `analytics.recommendation.accepted` | Decision approved | businessId, decisionId, decisionType |
| `analytics.recommendation.rejected` | Decision rejected | businessId, decisionId |
| `analytics.workflow.executed` | Loop workflow runs | businessId, workflowKey |
| `analytics.feedback.submitted` | FeedbackButton used | orgId, feedbackId |
| `analytics.nps.submitted` | Post-MRI NPS | businessId, score, comment |
| `analytics.integration.connected` | Integration linked | businessId, providerKey |
