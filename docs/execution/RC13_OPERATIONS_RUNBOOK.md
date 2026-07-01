# RC1.3 — Operations Runbook

**Audience:** Engineering and Operations teams
**Last Updated:** 2026-07-01

---

## Health Check

```bash
curl http://localhost:4000/health
```

Response shape:
```json
{
  "status": "ok",          // "ok" | "degraded"
  "version": "0.9.0-rc1",
  "checks": {
    "api": "ok",
    "errorRate": "0.0%",
    "heapMb": 42,
    "uptimeMs": 3600000
  },
  "counters": { ... },
  "latency": { "httpRequestsP50Ms": 12, "httpRequestsP95Ms": 45 },
  "memoryMb": { "rss": 80, "heapUsed": 42, "heapTotal": 64 },
  "capturedAt": "2026-07-01T00:00:00.000Z"
}
```

HTTP 200 = healthy. HTTP 503 = degraded (error rate ≥5% or heap ≥900MB).

---

## Ops Dashboard

Navigate to `/ops` in the web app (no login required). Shows live status, counters, latency, memory, and feature flags.

---

## Feature Flags

### View current flags
```bash
curl http://localhost:4000/api/v1/flags
```

### Toggle a flag (via env var — requires restart)
```bash
BOSS_FLAG_BETA_ONBOARDING=true npm start
BOSS_FLAG_AI_WORKFORCE=true npm start
```

| Flag | Default | Purpose |
|------|---------|---------|
| `operating_loop` | true | BTE 24h loop |
| `multi_agent` | true | Multi-agent workflows |
| `scenario_simulation` | true | Decision scenario engine |
| `executive_briefs` | true | AI executive briefings |
| `beta_onboarding` | false | First-cohort enrollment gate |
| `ai_workforce` | false | AI employee runtime |
| `marketplace` | false | Template marketplace |

---

## Degradation Thresholds

| Metric | Warning | Critical |
|--------|---------|---------|
| Error rate | > 2% | > 5% |
| Heap used | > 700MB | > 900MB |
| P95 latency | > 500ms | > 2000ms |

---

## Incident Response

### API Offline
1. Check process: `ps aux | grep node`
2. Check logs for startup errors
3. Restart: `npm start` in `apps/api`
4. Verify: `curl /health` returns 200

### High Error Rate
1. Check `/health` — `checks.errorRate`
2. Check recent `event_log` entries for failures
3. Check `counters.circuitBreakersOpened` — if > 0, external dependency is failing
4. Check `counters.httpErrors` vs `httpRequests`

### Memory Pressure
1. Check `memoryMb.heapUsed` on `/health`
2. Check for workflow backlog (stuck jobs)
3. Restart API if heap > 900MB and not recovering

---

## Support Feedback Monitoring

Feedback is recorded as events in the `event_log` table with type `support.feedback.submitted`.

To query recent feedback:
```sql
SELECT payload->>'message', payload->>'category', payload->>'orgId', occurred_at
FROM event_log
WHERE type = 'support.feedback.submitted'
ORDER BY occurred_at DESC
LIMIT 50;
```

---

## Deployment Checklist

- [ ] Set `BOSS_FLAG_BETA_ONBOARDING=true` for first cohort
- [ ] Verify `/health` returns 200
- [ ] Open `/ops` — confirm all counters at 0 (fresh start)
- [ ] Run smoke test: create business → start MRI → view workspace
- [ ] Confirm `support@boss.ai` email inbox is monitored
