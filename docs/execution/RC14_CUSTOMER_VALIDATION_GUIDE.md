# RC1.4 — Customer Validation Guide
## How to measure PMF with the beta cohort

**Audience:** CS team, founders
**Last Updated:** 2026-07-01

---

## The Question We're Answering

> Do small business owners achieve measurable business outcomes using BOSS within 30 days?

If yes: we have early PMF signal. Expand beta.
If no: we have data on where the value breaks down. Fix it.

---

## Enrollment Process

1. CS generates invite code: `POST /api/v1/beta/invites` (or via `/cs` page → future)
2. Share code with customer via email: "Your BOSS beta access code: BOSS-XXXXXXXX"
3. Customer creates their business at `/` and enters invite code
4. Backend validates and redeems: `POST /api/v1/beta/invites/:code/redeem`
5. Customer appears in `/cs` dashboard (health score starts at 0)

---

## Monitoring: The /cs Dashboard

Visit `/cs` to see all enrolled customers:

- **Score 80–100 (Champion)**: proactively ask for case study, testimonial, referral
- **Score 60–79 (Healthy)**: weekly check-in, ask what they'd improve
- **Score 40–59 (At Risk)**: reach out within 48h, offer 15-min call
- **Score 0–39 (Critical)**: same-day intervention — why haven't they used it?

Check `/cs` every business day during the beta.

---

## Week-by-Week Playbook

### Week 1 (Days 1–7): Onboarding
**Goal:** Every customer completes MRI (health score ≥ 20)

Actions:
- Day 1: Send welcome email with workspace link and onboarding video
- Day 3: Check `/cs` — any score = 0? Send personal "Can I help?" email
- Day 5: Check activation count on `/cs` metrics bar
- Day 7: Send "Week 1 check-in" survey (2 questions: Did you complete MRI? Did anything confuse you?)

### Week 2 (Days 8–14): Activation
**Goal:** Every customer views workspace + approves 1 decision (health score ≥ 65)

Actions:
- Day 8: Check WAB metric — how many returned?
- Day 10: For score < 40: schedule 15-min call — "What would make BOSS more useful for you?"
- Day 14: Review activation rate on `/cs`

### Week 3–4 (Days 15–30): Outcome Evidence
**Goal:** Collect outcome evidence from champions

Actions:
- Send outcome survey to score ≥ 60 customers:
  1. What's the biggest way BOSS has helped you?
  2. What metric improved? (revenue, customers, hours saved)
  3. NPS score (0–10)
  4. Would you pay for this? What would you pay?
- Collect 3+ outcome stories for PMF decision

---

## PMF Decision Framework

At Day 30:

| Signal | Weight | Green | Yellow | Red |
|--------|--------|-------|--------|-----|
| Activation rate | 30% | >70% | 40-70% | <40% |
| NPS avg | 25% | ≥30 | 0-30 | <0 |
| % with outcome story | 25% | >30% | 15-30% | <15% |
| WAB week 4 | 20% | >50% | 25-50% | <25% |

**3+ greens = expand beta. 2+ reds = fix before expanding.**

---

## Evidence Collection Template

After 30 days, collect from each customer:

```
1. When you joined BOSS, what was your biggest business challenge?

2. Did BOSS help you make progress on that challenge? How?

3. What specific metric improved? 
   (e.g., "reduced admin time by 5 hours/week", "added 3 new customers", 
    "saved $2,000 by catching a cost I missed")

4. On a scale of 0–10, how likely are you to recommend BOSS 
   to another business owner? Why that score?

5. If BOSS cost $X/month, would you pay for it? 
   (X = $49, $99, $199 — test different price points)

6. What's the one thing that would make BOSS 10x more valuable for you?
```

This evidence becomes the RC1.5 product backlog.

---

## Analytics Queries (for engineering support)

```bash
# Activation rate
curl http://localhost:4000/api/v1/analytics/activation

# Weekly active businesses
curl http://localhost:4000/api/v1/analytics/wab

# Monthly active businesses  
curl http://localhost:4000/api/v1/analytics/mab

# Funnel for a specific business
curl http://localhost:4000/api/v1/analytics/funnel/{orgId}/{businessId}

# All customer health scores
curl http://localhost:4000/api/v1/cs/health
```
