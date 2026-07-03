# RC1.5 Operational Readiness

**Date:** 2026-07-03  
**Assessment:** OPERATIONAL — 14/14 tests passing

---

## Health Endpoint

**Endpoint:** `GET /health`  
**Auth:** None required (safe for load balancer probes)  
**Response time:** < 50ms observed (target: < 200ms)

Response schema:
```json
{
  "status": "ok",
  "uptimeMs": 12345,
  "memoryMb": { "rss": 45.2, "heapUsed": 22.1, "heapTotal": 30.5 },
  "counters": { "httpRequests": 3 }
}
```

Headers:
- `x-trace-id`: UUID for distributed tracing

---

## Metrics Endpoint

**Endpoint:** `GET /api/v1/metrics`  
**Auth:** None required (internal/operator use)

Response schema:
```json
{
  "counters": { "httpRequests": 42 }
}
```

Counters increment per request, reset on process restart. Prometheus/OpenTelemetry export to be added in RC2.

---

## Scheduler Diagnostics

| Diagnostic | Available? | How |
|-----------|-----------|-----|
| List pending jobs | YES | `scheduler.listPending(orgId, businessId?)` |
| Inspect runAt timestamp | YES | `SchedulerJob.runAt` |
| Cron expression visibility | YES | `SchedulerJob.cronExpression`, `triggerType` |
| Failed job recovery count | YES | `scheduler.recoverFailed()` returns count |
| Next run time after recovery | YES | `SchedulerJob.nextRunAt` after recovery |

---

## Mission Control Dashboard

`MissionControlService.getSnapshot(orgId, businessId)` returns:
- `businesses[]` — all businesses for org with health summary
- `workflows[]` — recent workflow executions with task details
- `timeline[]` — ordered business events  
- `deadLetters[]` — failed jobs requiring operator attention
- `decisions{}` — decision queue summary

**Dead letter visibility:** Dead letters appear in the snapshot for immediate operator action. Each entry includes `jobType`, `jobId`, `errorMessage`, `attemptCount`, `failedAt`.

---

## Provider Health Diagnostics

`ToolFabricService.getProviderHealth()` returns per-provider status:
```json
[
  { "key": "smtp", "healthy": true, "latencyMs": 95, "lastCheckedAt": "..." }
]
```

Unhealthy providers surface with `healthy: false` and no `latencyMs`.

---

## Audit Trail Operability

`EventLog.listByOrgId(orgId, limit)` provides chronological audit access. Supports:
- Per-org event scoping
- Configurable page size (`limit`)
- Causal chain tracing via `correlationId` / `causationId`

---

## Incident Response Playbook

| Failure Mode | Detection | Recovery |
|-------------|-----------|---------|
| Workflow stuck | `mission_control.workflows` shows `state: running` for > 15min | `scheduler.recoverFailed()` |
| Dead letters accumulating | `mission_control.deadLetters.length > 0` | Inspect `errorMessage`, fix payload, re-enqueue |
| Provider degraded | `getProviderHealth()` shows `healthy: false` | Rotate credentials, check provider status page |
| JWT secret rotated | All requests return 401 | Update `SUPABASE_JWT_SECRET` env var, redeploy |
| Memory growth | `/health` shows `heapUsed` trending up | Restart process, open tech debt ticket |

---

## RC2 Operational Gaps

1. **Prometheus/OTEL export** — counters not exported to external metrics system yet
2. **Alerting** — no alerting rules defined for dead letter threshold or health endpoint degradation
3. **PagerDuty/Incident integration** — not wired
4. **Log aggregation** — Pino structured JSON logs not yet shipped to centralized log store
5. **Scheduler observability** — no dashboard for cron job next-run times at fleet scale
