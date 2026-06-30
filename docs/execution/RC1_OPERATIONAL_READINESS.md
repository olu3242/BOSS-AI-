# RC1 Operational Readiness

**Date:** 2026-06-30

---

## Runtime Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Express HTTP Server (apps/api)                         │
│    ├── Auth Middleware (JWT/RBAC)                       │
│    ├── Request Tracing (x-trace-id)                     │
│    ├── Zod Validation                                   │
│    └── ~25 REST endpoints                               │
├─────────────────────────────────────────────────────────┤
│  Services Layer                                         │
│    ├── Business Intelligence (MRI, DNA, Health)         │
│    ├── Decision Intelligence (generate, lifecycle)      │
│    ├── Scenario Engine (calculate, compare, forecast)   │
│    ├── Tool Fabric (dispatch, circuit break, retry)     │
│    ├── Loop Runtime (workflow execution)                │
│    ├── Scheduler (cron, delayed, immediate)             │
│    ├── Multi-Agent Runtime (plan, execute, reflect)     │
│    └── Mission Control (snapshot, health)              │
├─────────────────────────────────────────────────────────┤
│  Persistence Layer (PostgreSQL via @boss/db)            │
│    ├── 28 repository implementations                    │
│    ├── 17 migrations (0001–0017)                        │
│    └── DurableEventBus → event_log table               │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Variables Required

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Production | PostgreSQL connection string |
| `SUPABASE_JWT_SECRET` | Production | JWT verification key |
| `SECRET_VAULT_KEY` | Production | 64-char hex for AES-256-GCM |
| `ANTHROPIC_API_KEY` | Optional | Enables Claude LLM features |
| `QB_SANDBOX` | Dev/Test | Set to `"true"` for QuickBooks sandbox |
| `NODE_ENV` | Always | Set to `"production"` in production |

---

## Startup Sequence

1. `installGeneralSmbPack()` — loads provider, tool, AI employee, policy registries
2. `createPostgresContainer()` — initializes all repositories and DurableEventBus
3. `createApiFromContainer(repos)` — wires all services
4. `createSchedulerService(repos, loopRuntime, stepRegistry)` — creates scheduler
5. Express server listens on `PORT` (default 3000)

---

## Health Check

`GET /health` (no auth required)

Returns:
```json
{
  "status": "ok",
  "counters": { ... },
  "latencyPercentiles": { ... }
}
```

---

## Operational Runbooks

### Scheduler Execution
The scheduler does NOT self-trigger. An external cron mechanism must call:
```
POST /api/v1/scheduler/run-due
Authorization: Bearer <service-token>
```
Recommended: pg_cron job every minute, or AWS EventBridge rule.

### Dead-Letter Recovery
Failed scheduler jobs can be retried via:
```
POST /api/v1/businesses/:businessId/scheduler/recover
```
Uses exponential backoff: 2^runCount minutes (max 60 minutes per attempt).

### Event Replay
To replay events from a point in time, query the event_log table:
```sql
SELECT * FROM event_log WHERE occurred_at >= '<timestamp>' ORDER BY occurred_at ASC;
```

---

## Monitoring Metrics Available

Via `GET /api/v1/metrics`:
- Workflow executions (total, completed, failed)
- Tool executions (total, completed, failed)
- Scheduler runs (due, completed, failed)
- Circuit breaker trips
- Evidence records created
- Request latency P50/P95 (ring buffer, last 1000 requests)
