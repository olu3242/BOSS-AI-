# BOSS V3 — Observability Report

**Date:** 2026-07-24  
**Status:** PARTIAL — structured logs present; distributed tracing not yet wired

---

## Logging

| Layer | Implementation | Status |
|---|---|---|
| API server | Pino (structured JSON) | ✅ |
| Request tracing | `traceId` generated per request (UUID) | ✅ |
| Auth events | Logged with `traceId` | ✅ |
| MRI lifecycle | `mri.started`, `mri.completed`, `mri.failed` logged | ✅ |
| Agent runs | `agent.run.started`, `agent.run.completed` logged | ✅ |
| Dashboard page | Server component logs with `traceId` and latency | ✅ |
| Secret values | Never logged | ✅ |

### Log Schema

```json
{
  "level": "info",
  "time": "2026-07-24T01:30:00.000Z",
  "traceId": "abc-123",
  "service": "boss-api",
  "event": "api_request_completed",
  "method": "GET",
  "path": "/api/v1/dashboard",
  "status": 200,
  "latencyMs": 42,
  "orgId": "uuid"
}
```

---

## Health Monitoring

| Endpoint | Response | Status |
|---|---|---|
| `GET /health` | `{ status, uptime, memoryMb, errorRate, requestCount }` | ✅ |
| Status `200` | Healthy | |
| Status `503` | `errorRate >= 5%` or `heapUsed > 900 MB` | |

---

## Error Tracking

| Control | Status |
|---|---|
| Sentry integration | ❌ Not yet wired |
| Unhandled exception capture | ❌ Process exits without Sentry |
| Error rate in health endpoint | ✅ Available |

---

## Metrics / Analytics

| Control | Status |
|---|---|
| PostHog integration | ❌ Not yet wired |
| Business event tracking | ❌ No product analytics |
| OpenTelemetry traces | ❌ Not yet wired |

---

## Event Journal (Audit Log)

The `JournaledEventBus` writes all domain events to `event_journal`:

| Event type | Status |
|---|---|
| `business.created` | ✅ |
| `mri.started` / `mri.completed` / `mri.failed` | ✅ |
| `agent.run.completed` | ✅ |
| `workflow.instance.completed` | ✅ |
| `org.created` | ✅ |

The event journal is the authoritative audit trail and is append-only.

---

## Open Items

### Must address before scaling
- [ ] **Sentry** — wire unhandled exception capture with secret redaction
- [ ] **OpenTelemetry** — distributed tracing across web → API → Supabase

### Should address
- [ ] **PostHog** — product analytics for user behavior (sign-up funnel, feature usage)
- [ ] **Automated alerting** — Render metrics → PagerDuty/Slack on error rate spike
- [ ] **Log aggregation** — Render logs → Logtail/Datadog for search and retention

---

## Certification Decision

**PARTIAL.** Structured logging and health endpoint are correctly implemented and provide basic operational visibility. The audit log (event journal) is complete. Distributed tracing and error reporting to Sentry are not yet wired — acceptable for MVP, required before scaling.
