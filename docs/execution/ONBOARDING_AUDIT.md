# BOSS V3 — Onboarding Audit

**Date:** 2026-07-24  
**Auditor:** Engineering (automated audit + code inspection)  
**Scope:** Every page, route, schema, and service involved in the onboarding workflow

---

## Flow Map

```
Sign-Up (/auth/sign-up)
    POST /api/auth/sign-up
    → identity.signUp(email, password)
    → [email confirm required] → /auth/verify
    → [immediate session] → /onboarding/organization

Organization Creation (/onboarding/organization)
    POST /api/organizations
    → OrganizationRuntime.create(userId, name, ctx)
    → /onboarding/setup

Business Wizard (/onboarding/setup — 7 steps)
    Step 1: Business name + industry
    Step 2: Profile (structure, employees, revenue, years, locations)
    Step 3: Working hours (days + open/close time)
    Step 4: Services offered (free-text)
    Step 5: Existing tool stack (multi-select)
    Step 6: AI workforce selection (multi-select)
    Step 7: Confirmation + navigation to workspace
    → POST /api/v1/businesses (Express API)
    → businessProfileService.createBusiness(...)
    → MRI auto-starts (background)

Dashboard (/dashboard)
    → requireActiveTenant() gate
    → OrgDashboardService aggregates stats
```

---

## Step-by-Step Audit

| Step | Inputs | Server Route | Validation (pre-RC1) | Validation (post-RC1) | Error Handling | Recovery |
|---|---|---|---|---|---|---|
| Sign-up | email, password | POST /api/auth/sign-up | HTML5 only | Zod (email format, pwd ≥8) | Sanitized message; no provider leakage | Retry form |
| Email verify | (link click) | Supabase-handled | N/A | N/A | Trace ID shown on failure | Re-request link |
| Sign-in | email, password, rememberMe | POST /api/auth/sign-in | HTML5 only | Zod (email format, pwd required) | Generic "Invalid email or password" | Retry form |
| Org creation | name | POST /api/organizations | None (runtime throws) | Zod (2–100 chars, non-blank) | Descriptive inline error | Retry on same page |
| Wizard Step 1 | businessName, industry | (client only) | Button gated on non-empty name | Zod (name 2–100, industry required) | Inline field errors | Form preserves state |
| Wizard Step 2 | businessType, counts, revenue | (client only) | None | Zod (positive ints, non-negative revenue) | Inline field errors | Form preserves state |
| Wizard Step 3 | openDays, openTime, closeTime | (client only) | None | Zod (≥1 day selected, times required) | Inline field errors | Form preserves state |
| Wizard Step 4 | services (text) | (client only) | None | Optional — no gate | N/A | Form preserves state |
| Wizard Step 5 | existingTools | (client only) | None | Optional — no gate | N/A | Form preserves state |
| Wizard Step 6 | aiAgents | (client only) | None | Zod (≥1 agent selected) | Inline field error | Form preserves state |
| Business create | all wizard data | POST /api/v1/businesses | Zod (partial — services/tools/agents dropped) | Zod (full — all fields included) | ApiClientError.body.message shown | Retry submit button |
| Dashboard init | (server-side auth) | GET /dashboard | N/A | N/A | Per-widget degraded state | Retry per widget |

---

## Bugs Found and Fixed

### BUG-001 — Silent Data Loss (P0 — FIXED)
**Impact:** `services`, `existingTools`, `aiAgents` collected in wizard Steps 4–6 were silently dropped by Zod's default `strip` mode at the API boundary. They were never persisted.  
**Root cause:** `CreateBusinessSchema` did not include these three fields.  
**Fix:** Added fields to `CreateBusinessSchema`, `CreateBusinessInput`, `BusinessProfile` type, in-memory and Postgres repos, and wrote migration 0048 to add columns to `business_profiles`.

### BUG-002 — Provider Error Leakage (P1 — FIXED)
**Impact:** Raw Supabase error messages (e.g. "User already registered", internal error codes) were piped verbatim into redirect URLs as `?error=...` query params — visible in browser history and logs.  
**Fix:** Sign-up route now maps known error patterns to user-friendly messages. Sign-in always returns a generic "Invalid email or password" (prevents user enumeration).

### BUG-003 — No HTTP-layer Validation on Auth Routes (P1 — FIXED)
**Impact:** Empty email/password strings reached Supabase with no validation. Invalid email formats were accepted by the route handler.  
**Fix:** Sign-up and sign-in routes now run Zod validation before calling the identity provider.

### BUG-004 — Org Name Validation Only in Runtime (P1 — FIXED)
**Impact:** Organization name length was validated inside `OrganizationRuntime.create()` with a plain `throw new Error(...)` — not at the HTTP layer. Error messages propagated verbatim.  
**Fix:** Organization POST route validates name with Zod before passing to runtime. Runtime validation remains as defense-in-depth.

### BUG-005 — Step 6 Had No Validation Gate (P1 — FIXED)
**Impact:** Users could click "Launch" with zero AI agents selected. The API would create a business with an empty `aiAgents` array, defeating the workforce provisioning step.  
**Fix:** Step 6 now requires at least one AI agent selected. `goNext()` runs Zod validation before proceeding.

---

## Gaps Remaining (Post-RC1)

| Gap | Priority | Notes |
|---|---|---|
| No shared `packages/validation` — client + server schemas are parallel, not shared | High | Requires new workspace package + build pipeline changes. Scheduled Sprint +1. |
| Password reset confirmation check is in route handler, not Zod | Medium | Works correctly; just inconsistent pattern. |
| OAuth callback error handling is client-side state only — no server error log | Medium | Trace ID is surfaced to user. |
| No per-field server validation errors returned to wizard | Low | Zod error on API returns 400 with message; wizard shows it as a single banner error. Field-level mapping is Sprint +2. |
| Business name uniqueness is not enforced at onboarding | Low | Not a UX requirement; org isolation means same-named businesses in different orgs are fine. |
