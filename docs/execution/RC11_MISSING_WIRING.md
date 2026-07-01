# RC1.1 — Missing Wiring Registry
## What Is Broken, What Is Missing, and the Fix for Each

**Date:** 2026-07-01
**Priority:** P0 = blocks launch | P1 = breaks user journey | P2 = reduces experience | P3 = RC2+

---

## P0 — Launch Blockers (Fix Before Any User Can Use the Product)

### P0-1: No Auth UI
**Impact:** Zero customers can register or log in. Every API call uses a hardcoded dev org.
**Root cause:** No signup/login pages. No Supabase client-side session. `DEMO_ORG_ID` hardcoded in `apps/web/src/lib/demoOrg.ts`.
**Files to create:**
- `apps/web/src/app/auth/signup/page.tsx`
- `apps/web/src/app/auth/login/page.tsx`
- `apps/web/src/app/auth/verify/page.tsx`
- `apps/web/src/lib/supabase.ts` — Supabase browser client
**Files to modify:**
- `apps/web/src/lib/apiClient.ts` — replace dev-token with real session token
- `apps/web/src/lib/demoOrg.ts` — replace with real `getOrgId()` from session
**Backend dependency:** TD-030 — Supabase custom access-token hook to inject `org_id` into JWT. Until this hook is live, real Supabase JWTs will be rejected by `requireOrgId()` because they lack the `org_id` claim.

---

### P0-2: No MRI Onboarding Flow
**Impact:** Business health score, KPIs, constraints, recommendations, and decisions cannot be generated without an MRI. The entire operating loop depends on it. Users who create a business see an empty workspace.
**Root cause:** Five backend MRI routes exist; zero frontend pages consume them.
**Files to create:**
- `apps/web/src/app/business/[businessId]/mri/page.tsx` — MRI question flow
- `apps/web/src/app/business/[businessId]/mri/complete/page.tsx` — MRI complete, redirect to workspace
**apiClient methods to add:**
- `startMri(orgId, businessId)`
- `submitMriAnswers(orgId, mriId, answers)`
- `completeMriSection(orgId, mriId, sectionKey)`
- `completeMri(orgId, mriId)`
- `getMriResponses(orgId, mriId)`

---

## P1 — Broken User Journey (Fix Before First Demo)

### P1-1: `businessType` Bug in Business Creation
**Impact:** Business `businessType` field always equals the `industry` value. Business DNA and health score will use wrong business type.
**File:** `apps/web/src/app/business/new/page.tsx`, line ~23
**Fix:** Add a separate `businessType` form field (e.g. "LLC", "Sole Proprietor", "Corporation") or derive it from industry selection. `businessType` and `industry` must be distinct values from distinct form inputs.

---

### P1-2: Automation Page — `executedAt` Field Does Not Exist
**Impact:** Automation tab renders `execution.executedAt` for every row — all dates show `undefined`. Tool execution history is invisible to users.
**File:** `apps/web/src/app/business/[businessId]/workspace/automation/page.tsx`
**Fix:** Replace `execution.executedAt` with `execution.startedAt`. Display `execution.completedAt` as the end time when present.

---

### P1-3: Settings Page — No Authorization Header
**Impact:** `GET /businesses/:id` always returns 401 in any environment with real auth. Settings tab is permanently broken.
**File:** `apps/web/src/app/business/[businessId]/workspace/settings/page.tsx`
**Fix:** Replace raw `fetch()` call with `apiClient.getBusiness(orgId, businessId)`. Pass real `orgId` from session instead of hardcoded `DEMO_ORG_ID`.

---

### P1-4: Approvals Page — Buttons Disabled
**Impact:** Users can see pending decisions and recommendations but cannot approve or reject them. The core approval workflow is broken.
**File:** `apps/web/src/app/business/[businessId]/workspace/approvals/page.tsx`
**Root cause:** Buttons were disabled pending auth wiring. `apiClient.approveDecision()` and `apiClient.rejectDecision()` exist; they are just never called.
**Fix:** Wire approve/reject buttons to the existing `apiClient` methods. Add optimistic UI state (pending → approved/rejected). Requires P0-1 (real auth) first.

---

### P1-5: Intelligence Page — Calls Wrong Endpoint
**Impact:** Intelligence Center shows the same KPI data as the Overview page. Root cause analysis (`/rootcause`) and dedicated KPI breakdown (`/kpis`) are never called.
**File:** `apps/web/src/app/business/[businessId]/workspace/intelligence/page.tsx`
**Fix:** Replace `apiClient.getWorkspace()` call with:
- `apiClient.getKpis(orgId, businessId)` → KPI Readings panel
- `apiClient.getRootCause(orgId, businessId)` → Active Intelligence Signals
- `apiClient.getDecisions(orgId, businessId)` → Decision Pipeline
**apiClient methods to add:**
- `getKpis(orgId, businessId)` → `GET /businesses/:id/kpis`
- `getRootCause(orgId, businessId)` → `GET /businesses/:id/rootcause`
- `getDecisions(orgId, businessId)` → `GET /businesses/:id/decisions`

---

## P2 — Reduced Experience (Fix Before RC1 Complete)

### P2-1: Mission Control Page — apiClient Not Wired
**File:** `apps/web/src/app/business/[businessId]/mission-control/page.tsx`
**Fix:** Audit the page. Add `apiClient.getMissionControl(orgId, businessId)` → `GET /businesses/:id/mission-control`. The page may be using a direct fetch — standardize through apiClient.

---

### P2-2: No Post-MRI Redirect to Workspace
**Impact:** After MRI completion, user has no clear next step.
**Fix:** After `completeMri()` succeeds, redirect to `/business/[businessId]/workspace`.

---

### P2-3: Home Page is Empty
**File:** `apps/web/src/app/page.tsx`
**Fix:** Redirect authenticated users to their most recent workspace. Redirect unauthenticated users to `/auth/login`.

---

### P2-4: No Empty State After Business Creation
**Impact:** After creating a business, user lands somewhere undefined (no redirect).
**File:** `apps/web/src/app/business/new/page.tsx`
**Fix:** After `createBusiness()` succeeds, redirect to `/business/[newBusinessId]/mri` to start the MRI flow.

---

## P3 — RC2+ Scope (Do Not Implement in RC1)

These gaps are real but not on the RC1 critical path:

| Gap | Route | RC Phase |
|-----|-------|----------|
| Business DNA UI | `GET/POST /businesses/:id/dna` | RC2 |
| Capabilities UI | `GET/POST /businesses/:id/capabilities` | RC2 |
| Constraint management UI | `POST /constraints/:id/dismiss` | RC2 |
| Recommendation roadmap | `GET /businesses/:id/recommendations/roadmap` | RC2 |
| Decision executive brief | `GET /decisions/:id/brief` | RC2 |
| Scenario simulation | `GET/POST /businesses/:id/scenarios` | RC3 |
| Execution planning | `GET/POST /businesses/:id/plans/:decisionId` | RC2 |
| Outcome verification | `GET/POST /businesses/:id/verification/:decisionId` | RC2 |
| Operating loop trigger UI | `POST /businesses/:id/operating-loop/run` | RC2 |
| Multi-agent delegation | `POST /businesses/:id/multi-agent/delegate` | RC3 |
| Provider connect/disconnect | `POST /businesses/:id/integrations/:key/connect` | RC2 |
| Tool audit history | `GET /businesses/:id/tools/audit` | RC2 |
| Metrics observability | `GET /metrics` | GA |

---

## RC1 Implementation Order

**Must ship for RC1:**

| Order | Task | Workstream |
|-------|------|-----------|
| 1 | Fix `executedAt` → `startedAt` bug | WS-3 (1 line) |
| 2 | Fix `businessType` bug | WS-3 (1 line) |
| 3 | Fix settings page auth header | WS-3 (apiClient swap) |
| 4 | Fix intelligence page endpoints | WS-3 (add apiClient methods) |
| 5 | Build auth UI (signup/login/verify) | WS-4 |
| 6 | Configure Supabase session in apiClient | WS-4 (TD-030) |
| 7 | Build MRI flow (5 pages) | WS-5 |
| 8 | Wire approve/reject on approvals page | WS-3 (depends on WS-4) |
| 9 | Home page redirect logic | WS-8 |
| 10 | Post-creation redirect to MRI | WS-8 |
| 11 | Post-MRI redirect to workspace | WS-8 |
| 12 | E2E test: full customer journey | WS-10 |

**Deferred to RC2:** Everything in P3 table above.

---

## Architecture Boundary Rules for RC1 Implementation

1. **No new API services** — all new apiClient methods call existing routes
2. **No new backend routes** — all wiring uses existing endpoints
3. **No business logic in frontend** — pages are read/display only; mutations go through apiClient → API
4. **No new MCP modules** — MRI intelligence already exists in `packages/mcp/src/intelligence/`
5. **Auth via Supabase only** — no custom auth implementation; session token → `requireOrgId()` → JWT claim
