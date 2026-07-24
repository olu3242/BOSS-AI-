# Platform Reliability Framework — Diagnostics Reference

**Date:** 2026-07-24
**Scope:** BOSS V3 RC1

---

## Overview

The Platform Reliability Framework (PRF) establishes a single runtime contract enforced by shared infrastructure across every BOSS feature. No feature is considered complete because its UI renders — a feature is complete when it loads, retrieves data, handles failures gracefully, preserves user state, and provides actionable diagnostics.

---

## Shared Infrastructure

### `useFeatureRuntime<T>` hook

Location: `apps/web/src/lib/featureRuntime.ts`

Every feature that loads async data should use this hook instead of writing its own `loading/error/data` state.

```typescript
const [state, { load, retry, setData }] = useFeatureRuntime<MyData>(
  "FeatureName",
  async () => {
    const data = await apiClient.getMyData(orgId);
    return { data, dependencies: [{ name: "My Service", status: "healthy" }] };
  }
);
```

**State shape:**
```typescript
{
  status: "idle" | "loading" | "success" | "degraded" | "error";
  data: T | null;
  error: FeatureRuntimeError | null;
  dependencies: FeatureDependency[];
  correlationId: string | null;
  latencyMs: number | null;
  retryCount: number;
  lastSuccessAt: string | null;
}
```

**Error shape:**
```typescript
{
  code: string;           // e.g. "MARKETPLACE_FETCH_FAILED"
  message: string;        // Human-readable, no stack traces
  httpStatus?: number;    // If from an HTTP request
  dependency?: string;    // Which named dependency failed
  correlationId: string;  // UUID for cross-referencing logs
  traceId?: string;       // From API error body
  retryable: boolean;     // Whether Retry button should show
}
```

---

## Error Code Reference

| HTTP Status | Error Code Pattern | Retryable |
|-------------|-------------------|-----------|
| 401 | `{FEATURE}_UNAUTHORIZED` | Yes (re-auth) |
| 403 | `{FEATURE}_UNAUTHORIZED` | No |
| 404 | `{DEPENDENCY}_NOT_FOUND` | No |
| 429 | `{FEATURE}_RATE_LIMITED` | Yes |
| 500–503 | `{DEPENDENCY}_SERVICE_ERROR` | Yes |
| Network | `{DEPENDENCY}_NETWORK_ERROR` | Yes |
| Auth chain | `SESSION_EXPIRED` | No (redirect) |
| Unknown | `{FEATURE}_FETCH_FAILED` | Yes |

---

## Dependency Lifecycle

Every feature load follows this lifecycle:

```
Load Session (GET /api/auth/token)
      ↓
Resolve Organization (from JWT claims)
      ↓
Verify Permissions (org_id in JWT, enforced by requireOrgId middleware)
      ↓
Execute Primary API (feature-specific endpoint)
      ↓
Execute Secondary API (optional — installed packs, metadata, etc.)
      ↓
Merge + Render
```

A failure at any stage produces a `FeatureRuntimeError` with `dependency` set to the failing stage name.

---

## Runtime Health Dashboard

URL: `/admin/runtime/features`

The runtime dashboard runs live health checks against every major platform feature using the actual API client (real credentials, real endpoints). It produces a pass/fail matrix that is used as a release gate.

**Required before deployment:**
- All features: `overall = PASS`
- No features: `apiStatus = fail` with `errorCode = AUTH_FAILED`
- No features: latency > 3000ms

---

## Session Continuity Contract

Features using `useWorkflowSession` automatically:
- Debounce-save to backend on every data/step change (500ms)
- Flush via `navigator.sendBeacon` on `beforeunload`
- Flush via `visibilitychange` when tab is hidden
- Resume from saved session on re-visit (via `onResumed` callback)

Features using `useInactivityTimeout` automatically:
- Show warning modal at `warningMs` (default: 9 min)
- Count down `timeoutMs - warningMs` seconds (default: 60s)
- Save + redirect to sign-in on timeout
- Reset timers on any user activity

---

## Structured Logging Standard

Every API error response must contain:
```json
{
  "code": "DESCRIPTIVE_ERROR_CODE",
  "message": "Human-readable explanation",
  "details": {},
  "traceId": "uuid-from-request-context"
}
```

No bare `500 Internal Server Error` responses. No stack traces in production responses. No generic "Something went wrong."

---

## Recovery Engine Pattern

```
API Timeout / 5xx
        ↓
Retry (up to retryCount shown in UI)
        ↓
Still Failing
        ↓
Show structured error with Correlation ID
        ↓
User: Retry / Support / Exit
```

Never crash the page. Never hide the error. Always give the user a next action.
