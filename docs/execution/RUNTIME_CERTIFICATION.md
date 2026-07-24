# Platform Runtime Certification

**Date:** 2026-07-24  
**Branch:** claude/boss-renaissance-v3  
**Certification:** RC1 Platform Reliability Framework — Initial Implementation

---

## Certification Scope

This certification covers the following PRF components shipped in this sprint:

### 1. Shared `useFeatureRuntime<T>` Hook

**Location:** `apps/web/src/lib/featureRuntime.ts`

**Certification criteria:**
- [x] Hook returns typed `FeatureRuntimeState<T>` with status, data, error, correlationId, latencyMs, retryCount
- [x] `FeatureRuntimeError` always contains: code, message, correlationId, retryable
- [x] `classifyError()` maps every HTTP status class to a deterministic error code
- [x] `classifyError()` maps network errors (`TypeError: fetch`) to `NETWORK_ERROR` codes
- [x] `classifyError()` maps auth failures to `SESSION_EXPIRED` with `retryable: false`
- [x] `classifyError()` maps 5xx to `retryable: true`
- [x] `correlationId` is a `crypto.randomUUID()` — unique per error instance
- [x] `traceId` forwarded from API error body when present

**Result: CERTIFIED**

---

### 2. Marketplace Structured Error Implementation

**Location:** `apps/web/app/marketplace/MarketplaceClient.tsx`

**Certification criteria:**
- [x] `useFeatureRuntime<MarketplaceData>` used in place of manual loading state
- [x] Catalog fetch and installed packs fetch are separate — failing dependency is named
- [x] `MarketplaceError` component displays: error code, HTTP status, dependency, correlation ID
- [x] Retry button shown only when `error.retryable === true`
- [x] Correlation ID is displayed as selectable text for support workflows
- [x] "View Details" expander shows dependency chain for technical users
- [x] Generic message "Failed to load marketplace." is eliminated

**Result: CERTIFIED**

---

### 3. Runtime Health Dashboard

**Location:** `apps/web/app/admin/runtime/features/`

**Certification criteria:**
- [x] Page requires authenticated tenant (`requireActiveTenant`)
- [x] Dashboard resolves session and org via `/api/auth/token`
- [x] Session status displayed before running checks
- [x] Each probe runs independently — one failure does not block others
- [x] Per-feature result captures: UI status, API status, auth status, latency, error code, HTTP status
- [x] Overall matrix badge: PASS / FAIL / PARTIAL / PENDING
- [x] Summary bar shows counts of each status
- [x] Release gate criteria documented in UI footer

**Result: CERTIFIED**

---

### 4. Business Creation Experience v2

**Location:** `apps/web/app/onboarding/setup/OnboardingSetupClient.tsx`

**Certification criteria:**
- [x] Business type selector replaced with 6-card grid
- [x] Employee count replaced with +/- stepper
- [x] Location count replaced with +/- stepper
- [x] Annual revenue replaced with currency-formatted input ($125,000 display)
- [x] Years operating replaced with segmented pill buttons (6 options)
- [x] Inactivity timeout wired: 9-min warning modal with live countdown
- [x] Inactivity modal has "Continue session" and "Save & exit" actions
- [x] Timeout triggers `cancel()` + redirect to `/auth/sign-in`
- [x] AI provisioning screen shown after business creation with 4 sequential steps
- [x] Provisioning screen is accessible (`role="status"`, `aria-live="polite"`)
- [x] Spinner respects `prefers-reduced-motion`

**Result: CERTIFIED**

---

### 5. Session Management

**Location:** `apps/web/src/hooks/useInactivityTimeout.ts`, `apps/web/src/hooks/useWorkflowSession.ts`

**Certification criteria:**
- [x] `useInactivityTimeout` clears all timers in `clearAll()`
- [x] Warning timer, timeout timer, and countdown interval all tracked in refs
- [x] Activity events reset timers only when modal is not showing (`!isWarning`)
- [x] `dismiss()` restarts the full timer sequence
- [x] `useWorkflowSession` debounces saves at 500ms
- [x] `sendBeacon` fires on `beforeunload` for unsaved data
- [x] `visibilitychange` flushes pending data when tab becomes hidden
- [x] Session resume prompt shown when active session detected

**Result: CERTIFIED**

---

## Outstanding Items (Not Blocking RC1)

| Item | Target |
|------|--------|
| Migrate remaining PARTIAL features to `useFeatureRuntime` | RC2 |
| Add automated runtime matrix check to CI | RC2 |
| Add `/api/admin/runtime/diagnostics` endpoint | RC2 |
| Add session continuity (filter/pagination restoration) to all features | RC2 |
| WCAG 2.2 AA audit of all new components | RC2 |

---

## Sign-off

This certification confirms that the Platform Reliability Framework foundation has been implemented and the Marketplace, Onboarding, and Admin Runtime pages conform to the PRF contract. All other features are tracked in `FEATURE_RUNTIME_MATRIX.md` for RC2 resolution.
