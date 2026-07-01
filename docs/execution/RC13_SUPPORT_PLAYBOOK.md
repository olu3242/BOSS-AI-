# RC1.3 — Support Playbook

**Audience:** Customer Success and Support teams
**Last Updated:** 2026-07-01

---

## Support Channels

| Channel | Response Target | Use For |
|---------|----------------|---------|
| In-app feedback (FeedbackButton) | 24h | Bug reports, feature requests, data issues |
| support@boss.ai | 24h | Any customer issue |
| `/ops` dashboard | Real-time | Engineering escalations |

---

## Feedback Categories

| Category | Routing | SLA |
|----------|---------|-----|
| `bug` | Engineering | 4h acknowledgement, 48h resolution |
| `data` | Engineering | 24h |
| `performance` | Engineering | 24h |
| `feature` | Product | Weekly review |
| `general` | CS | 24h |

---

## Common Customer Issues

### "I can't see my data"
1. Ask customer to confirm they completed the MRI (`/business/{id}/mri`)
2. Without MRI completion, workspace shows empty states — this is expected
3. If MRI completed but workspace still empty, check `/health` endpoint

### "My health score seems wrong"
1. Health score is derived from MRI answers — limited data = lower score
2. Prompt customer to complete more MRI sections
3. Score range 0–100, 0 = no data (not a bug)

### "Decisions aren't appearing"
1. Decisions require a health score — confirm health score was generated
2. Check `/business/{id}/decisions` returns data
3. Decisions in `generated` status need approval before appearing as active

### "The approval buttons don't work"
1. Confirm customer is using a supported browser (Chrome, Firefox, Safari latest)
2. Check `/health` error rate — may indicate API issue
3. Try refreshing — approval state persists on server

---

## Escalation Path

```
Customer reports issue
  → CS triages via email or in-app feedback
  → If reproducible: file engineering ticket with:
      - business ID
      - steps to reproduce
      - error message (exact)
      - timestamp
  → Engineering checks event_log and /health
  → Resolution communicated back to customer within SLA
```

---

## Diagnostic Commands (Engineering)

```bash
# Check API health
curl http://localhost:4000/health

# View recent events for a business
SELECT type, payload, occurred_at FROM event_log
WHERE payload->>'businessId' = '<id>'
ORDER BY occurred_at DESC LIMIT 20;

# View recent feedback
SELECT payload->>'category', payload->>'message', occurred_at
FROM event_log WHERE type = 'support.feedback.submitted'
ORDER BY occurred_at DESC LIMIT 20;
```

---

## First-Cohort Customer Profile

Target: 10–25 small businesses, self-selected, non-paying
Industries: HVAC, dental, coffee, cleaning, general SMB
Commitment: Weekly check-in, 30-min onboarding call

### Onboarding Script
1. Create account at `/`
2. Create your business profile
3. Complete the Business MRI (5 questions, 3 minutes)
4. View your workspace — health score, KPIs, decisions
5. Approve or reject your first decision recommendation
6. Set up return visit: bookmark the workspace URL
