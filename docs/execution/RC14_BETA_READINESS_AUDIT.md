# RC1.4 — Beta Readiness Audit

**Date:** 2026-07-01
**Status:** PRE-IMPLEMENTATION

---

## Scope

RC1.4 prepares BOSS for a controlled beta with 25–100 small businesses. The goal is to measure whether customers achieve real business outcomes — not just whether the product works.

---

## Audit Dimensions

### 1. Product Analytics

| Check | Status | Gap |
|-------|--------|-----|
| Event schema defined | ❌ | No structured product event taxonomy |
| Funnel events instrumented | ❌ | `business_created` emitted but not 11 other key events |
| Analytics service exists | ❌ | No `productAnalyticsService` |
| Workspace view tracked | ❌ | |
| MRI completion tracked | ✅ | `mri.completed` event exists |
| Recommendation acceptance tracked | ❌ | Event exists but not analytics-shaped |
| WAB / MAB metrics | ❌ | No weekly/monthly active business queries |

**Score: 1/7** ❌

### 2. Customer Health Score

| Check | Status | Gap |
|-------|--------|-----|
| Health score model defined | ❌ | No `CustomerHealthService` |
| Login/activity signals available | ❌ | No session tracking |
| MRI completion signal | ✅ | `mri.completed` event queryable |
| KPI engagement signal | ❌ | No workspace view tracking |
| Recommendation adoption signal | ✅ | `decision.approved` event exists |
| Workflow active signal | ✅ | `loopRuntime` has active workflow count |
| CS can view customer health | ❌ | No CS workspace |

**Score: 3/7** ❌

### 3. Feedback Loop

| Check | Status | Gap |
|-------|--------|-----|
| In-app feedback exists | ✅ | FeedbackButton + SupportService |
| NPS / satisfaction rating | ❌ | No structured rating |
| Onboarding feedback | ❌ | Post-MRI rating not collected |
| Feature satisfaction | ❌ | |
| Feedback queryable by CS | ❌ | Stored in event_log only |
| Feedback routing to product | ❌ | No triage flow |

**Score: 1/6** ❌

### 4. Customer Success Workspace

| Check | Status | Gap |
|-------|--------|-----|
| CS-facing page exists | ❌ | Only `/ops` (engineering) |
| Customer list view | ❌ | |
| Per-customer health view | ❌ | |
| Feedback triage view | ❌ | |
| Activity timeline per customer | ✅ | Via `businessTimeline` |

**Score: 1/5** ❌

### 5. Beta Operations

| Check | Status | Gap |
|-------|--------|-----|
| Beta flag exists | ✅ | `beta_onboarding` flag |
| Invite code mechanism | ❌ | No `betaInviteService` |
| Beta cohort tracking | ❌ | No cohort tagging |
| Enrollment limit enforcement | ❌ | |
| Off-boarding / removal | ❌ | |

**Score: 1/5** ❌

---

## Overall Score: 7/30 — REQUIRES RC1.4 IMPLEMENTATION

---

## RC1.4 Implementation Plan

| Workstream | Priority | Deliverable |
|-----------|----------|-------------|
| WS1 Product Analytics | P0 | `productAnalyticsService.ts`, 12 events wired |
| WS2 Customer Health Score | P0 | `customerHealthService.ts`, score model |
| WS3 Feedback Loop | P1 | NPS rating after MRI, feedback queryable |
| WS4 CS Workspace | P1 | `/cs` internal page |
| WS5 Beta Operations | P1 | `betaInviteService.ts`, enrollment gate |
| WS6 Evidence-Based Backlog | P2 | Product metrics doc + backlog query |
