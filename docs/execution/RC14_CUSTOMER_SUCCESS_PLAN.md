# RC1.4 — Customer Success Plan

**Date:** 2026-07-01

---

## Beta Cohort

**Target:** 10–25 small businesses, self-selected, non-paying
**Gate:** `beta_onboarding` feature flag + invite code
**Goal:** Demonstrate measurable business outcome in 30 days

---

## Customer Health Score Model

Each business receives a health score (0–100) computed from:

| Signal | Weight | Source |
|--------|--------|--------|
| MRI completed | 20 pts | `mri.completed` event |
| Workspace viewed (last 7d) | 20 pts | `analytics.workspace.viewed` |
| At least 1 decision approved | 25 pts | `analytics.recommendation.accepted` |
| Active workflows running | 20 pts | `loopRuntime.listActive()` |
| Feedback submitted | 15 pts | `analytics.feedback.submitted` |

**Thresholds:**
- 80–100: Champion — proactively ask for case study
- 60–79: Healthy — check in weekly
- 40–59: At Risk — outreach within 48h
- 0–39: Critical — same-day intervention

---

## Customer Success Workspace (`/cs`)

Internal page (no auth) showing:
- Customer list with health scores and trend
- Per-customer: MRI status, workspace views, decisions, feedback
- Feedback triage queue
- Beta cohort metrics: WAB, MAB, activation rate, decision adoption

---

## Beta Operations

### Enrollment
1. Generate invite code via `/cs` page
2. Share invite code with prospective customer
3. Customer enters invite code on landing page
4. Business profile creation enabled if `beta_onboarding=true` and valid invite

### Success Criteria (30 days)
- [ ] ≥ 70% of cohort activates (MRI + workspace + 1 decision)
- [ ] ≥ 3 customers report measurable outcome (revenue, efficiency, customer count)
- [ ] Net Promoter Score ≥ 30
- [ ] < 2 critical incidents per customer

---

## CS Playbook

### Week 1 (Days 1–7)
- Send welcome email with workspace link
- Monitor: Did they complete MRI? (health score ≥ 20)
- If no MRI by Day 3: personal outreach

### Week 2 (Days 8–14)
- Monitor: Did they view workspace? (health score ≥ 40)
- Monitor: Did they approve a decision? (health score ≥ 65)
- If health score < 40: schedule 15-min call

### Week 3–4 (Days 15–30)
- Weekly: check health scores
- Identify champions (score ≥ 80) for case study
- Collect outcome evidence: "What changed in your business?"

---

## Evidence Collection

After 30 days, collect from each customer:
1. What was your biggest business challenge when you joined?
2. Did BOSS help you address it? How?
3. What metric improved? (revenue, customers, hours saved, etc.)
4. Would you recommend BOSS to another business owner? (NPS)
5. What was the biggest friction point?

This evidence feeds the RC1.4 product backlog prioritization.
