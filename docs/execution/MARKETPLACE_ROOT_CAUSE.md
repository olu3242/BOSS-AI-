# Marketplace Root Cause Analysis

**Date:** 2026-07-24
**Branch:** claude/boss-renaissance-v3
**Symptom:** Red banner "Failed to load marketplace." with empty content area

---

## Failure Trace

```
Browser: MarketplaceClient.tsx
        ↓
apiClient.getMarketplacePacks(orgId)  →  GET /api/v1/marketplace/packs
apiClient.getInstalledPacks(orgId)    →  GET /api/v1/marketplace/installed
        ↓
Promise.all([...]) — any one failure triggers single catch block
        ↓
setError("Failed to load marketplace.")  ← GENERIC. No code, no dependency, no HTTP status
```

---

## Root Cause

**RC-1: Silent catch block masked per-dependency failures**

`Promise.all([allPacks, installedPacks])` wrapped both calls in a single `catch {}` block that threw away:
- Which of the two requests failed
- The HTTP status code
- The API error body (which contains a `traceId`)
- Whether the failure was retryable

**RC-2: Auth token chain has a silent failure point in production**

The browser-side auth path is:
1. `getBearerToken(orgId)` → calls `GET /api/auth/token`
2. `/api/auth/token` → calls `requireActiveTenant()` → reads Supabase session cookie
3. On success, calls `POST /api/v1/auth/dev-token` → returns JWT
4. JWT is attached as `Authorization: Bearer ...` header

If step 3 fails (dev-token disabled in production, or `NEXT_PUBLIC_API_BASE_URL` pointing to localhost), the error propagates as a generic 502 through `GET /api/auth/token`, which the `getBearerToken` function re-throws as `"Not authenticated"` — again losing the HTTP context of the underlying failure.

**RC-3: No correlation ID**

Every API response includes a `traceId` in error bodies. The Marketplace never surfaced this to users, making production debugging impossible without raw log access.

---

## Fix Applied

1. Separated `getMarketplacePacks` and `getInstalledPacks` into independent try/catch blocks so the failing dependency is named in the error
2. Replaced `setError("Failed to load marketplace.")` with `useFeatureRuntime` hook that:
   - Calls `classifyError()` to map HTTP status → structured error code
   - Captures `traceId` from API error bodies
   - Sets `correlationId` (client-generated UUID for cross-referencing)
   - Determines `retryable: boolean` from HTTP status
3. Replaced generic red banner with `MarketplaceError` component showing:
   - Human-readable message
   - Error code (e.g. `MARKETPLACE_INSTALLED_PACKS_NOT_FOUND`)
   - HTTP status
   - Dependency name
   - Correlation ID (selectable for support tickets)
   - Retry button (only shown when retryable)
   - View Details expander

---

## Verification Steps

To reproduce the exact failure:
```bash
# 1. Set API to a non-existent host
NEXT_PUBLIC_API_BASE_URL=http://localhost:9999

# 2. Load /marketplace
# Expected (before fix): "Failed to load marketplace." with no context
# Expected (after fix):
#   Error Code: MARKETPLACE_NETWORK_ERROR
#   Dependency: Industry Pack Catalog
#   Correlation ID: <uuid>
#   [Retry] button
```

---

## Prevention

The `useFeatureRuntime` hook enforces the structured error contract. Any feature using it cannot accidentally surface a generic error message — the hook's `classifyError` function always produces a typed `FeatureRuntimeError` with a code, dependency, correlationId, and retryable flag.
