# RC1.4 — Beta Certification
## Customer Validation & Product-Market Fit

**Certified:** 2026-07-01
**Status:** CERTIFIED FOR CONTROLLED BETA (25–100 businesses)

---

## Certification Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Typecheck: 0 errors | ✅ PASS | api + web |
| Tests: 100% pass | ✅ PASS | 239/239 |
| Product analytics: 12 events defined | ✅ PASS | |
| Domain event bridge: 5 events auto-tracked | ✅ PASS | |
| Customer health score: 5 signals, 4 tiers | ✅ PASS | |
| NPS collection: post-MRI widget | ✅ PASS | |
| CS Workspace: /cs page with health list | ✅ PASS | |
| Beta invite management: generate/validate/redeem | ✅ PASS | |
| Activation rate API | ✅ PASS | |
| WAB/MAB metrics | ✅ PASS | |
| Funnel query per business | ✅ PASS | |

---

## Activation Gate

A business is **activated** when:
1. MRI completed (`analytics.mri.completed` recorded)
2. Decision approved (`analytics.recommendation.accepted` recorded)

Target for beta: ≥ 70% activation rate within 7 days of enrollment.

---

## Go/No-Go Thresholds

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Activation rate | > 70% | 40–70% | < 40% |
| WAB (week 2) | > 60% | 30–60% | < 30% |
| NPS score (avg) | ≥ 30 | 0–30 | < 0 |
| Champion tier (% of cohort) | > 30% | 15–30% | < 15% |
| Critical tier (% of cohort) | < 10% | 10–25% | > 25% |

---

## Pre-Launch Checklist

- [ ] Set `BOSS_FLAG_BETA_ONBOARDING=true`
- [ ] Generate invite codes via `POST /api/v1/beta/invites`
- [ ] Verify `/cs` page loads with empty state
- [ ] Verify `/ops` shows healthy API
- [ ] Send first invite to pilot customer
- [ ] Monitor `/cs` daily for health score changes
- [ ] Conduct Week 1 check-in call with each enrolled customer

---

## Certification Signature

This codebase is certified for a controlled beta with 25–100 small businesses. Product analytics, customer health scoring, NPS collection, and CS tooling are operational. Beta invite management allows controlled enrollment.

**Not yet certified for:** general availability, self-serve sign-up, payment processing.
