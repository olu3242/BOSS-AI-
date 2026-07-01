# RC1.1 — Frontend ↔ Backend Audit
## Zero Mock Data • End-to-End Wiring • Architecture Preservation

**Date:** 2026-07-01
**Status:** PHASE 0 COMPLETE — Audit findings documented, implementation blocked until all three Phase 0 docs are written

---

## Audit Scope

Every frontend page and API client method was audited against the backend route table (`apps/api/src/http/server.ts`). Every gap, mock, and type mismatch is catalogued below.

---

## Frontend Pages Inventory

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Home | `/` | ⚠️ Stub | No content — links to nothing |
| New Business | `/business/new` | ⚠️ Partial | Form wired but `businessType` bug; uses `DEMO_ORG_ID` |
| Mission Control | `/business/[id]/mission-control` | ⚠️ Unknown wiring | Needs audit |
| Workspace Overview | `/business/[id]/workspace` | ⚠️ Mock auth | Uses `DEMO_ORG_ID` + dev-token |
| Workspace Timeline | `/business/[id]/workspace/timeline` | ⚠️ Mock auth | Uses `DEMO_ORG_ID` + dev-token |
| Workspace Approvals | `/business/[id]/workspace/approvals` | ❌ Broken | Buttons disabled; `apiClient.approveDecision` not called |
| Workspace Automation | `/business/[id]/workspace/automation` | ❌ Broken | Uses `execution.executedAt` — field doesn't exist (is `startedAt`) |
| Workspace Intelligence | `/business/[id]/workspace/intelligence` | ⚠️ Suboptimal | Calls `getWorkspace` instead of `/kpis`, `/rootcause`, `/constraints` |
| Workspace Settings | `/business/[id]/workspace/settings` | ❌ Broken | Raw `fetch()` with no `Authorization` header — will always 401 in production |
| Auth (signup/login) | — | ❌ Missing | No auth pages exist anywhere in `apps/web` |
| MRI Flow | — | ❌ Missing | 5 backend endpoints, 0 frontend pages |

---

## Auth Layer Audit

| Item | Status | Detail |
|------|--------|--------|
| Auth UI (signup) | ❌ Missing | No page exists |
| Auth UI (login) | ❌ Missing | No page exists |
| Auth UI (email verify) | ❌ Missing | No page exists |
| Session management | ❌ Missing | No Supabase client-side session code |
| `DEMO_ORG_ID` placeholder | ⚠️ Dev-only | `"00000000-0000-0000-0000-000000000001"` hardcoded in `lib/demoOrg.ts` |
| Dev-token in API client | ⚠️ Dev-only | `apiClient.ts` calls `/auth/dev-token` before every request |
| Supabase JWT `org_id` claim | ❌ Not implemented | TD-030 — no custom access-token hook configured |
| `requireOrgId()` | ✅ Real | Validates HS256 JWT via `jose`, reads `org_id` claim |

---

## Type Mismatch Audit

| Interface | Field Issue | Frontend Uses | Backend Returns |
|-----------|-------------|---------------|-----------------|
| `KpiReading` | Key field name | `kpi.key` (some pages) | `kpi.kpiKey` |
| `ToolExecution` | Timestamp field | `execution.executedAt` | `startedAt` / `completedAt` |
| `IntegrationAccount` | Response shape | Object wrapper | Bare array |
| `ToolExecution` list | Response shape | Object wrapper | Bare array |
| Timeline events | Response shape | Object wrapper | Bare array |

---

## Mock Data Audit

| Mock | Location | Impact |
|------|----------|--------|
| `DEMO_ORG_ID` | `apps/web/src/lib/demoOrg.ts` | All workspace pages use hardcoded org |
| Dev-token fetch | `apps/web/src/lib/apiClient.ts` | Every API call bypasses real auth |
| Disabled approve/reject | `workspace/approvals/page.tsx` | Approvals page is read-only with no explanation |
| Raw `fetch()` | `workspace/settings/page.tsx` | No `Authorization` header — always 401 |

---

## Critical Bugs

| Bug | File | Line | Description |
|-----|------|------|-------------|
| `businessType` field | `apps/web/src/app/business/new/page.tsx` | ~23 | `businessType: form.get("industry")` — both fields use the industry value |
| `executedAt` undefined | `apps/web/src/app/business/[businessId]/workspace/automation/page.tsx` | — | `ToolExecution` has no `executedAt` field; use `startedAt` |
| Settings page no auth | `apps/web/src/app/business/[businessId]/workspace/settings/page.tsx` | — | Raw `fetch()` with no Bearer token |

---

## Backend Routes Not Reachable from Frontend

The following 40+ backend routes have no corresponding frontend page or UI action:

**MRI (5 routes — entire onboarding flow missing):**
- `POST /businesses/:id/mri` — start MRI
- `POST /mri/:id/answers` — submit answers
- `POST /mri/:id/sections/:key/complete` — complete section
- `POST /mri/:id/complete` — finalize MRI
- `GET /mri/:id/responses` — read responses

**Business DNA:**
- `POST /businesses/:id/dna` — generate DNA
- `GET /businesses/:id/dna` — read DNA

**Health:**
- `POST /businesses/:id/health` — generate health score

**Capabilities:**
- `POST /businesses/:id/capabilities` — evaluate capabilities
- `GET /businesses/:id/capabilities` — list capabilities

**Constraints (analysis and management):**
- `POST /businesses/:id/constraints/analyze` — analyze constraints
- `GET /businesses/:id/constraints/priorities` — constraint priorities
- `POST /constraints/:id/status` — update status
- `POST /constraints/:id/dismiss` — dismiss constraint

**Recommendations (full pipeline):**
- `POST /businesses/:id/recommendations/analyze` — analyze
- `GET /businesses/:id/recommendations/priorities` — priorities
- `GET /businesses/:id/recommendations/roadmap` — roadmap
- `POST /recommendations/:id/status` — update status
- `POST /recommendations/:id/dismiss` — dismiss
- `POST /recommendations/:id/approve` — approve

**Integrations (connect/disconnect):**
- `POST /businesses/:id/integrations/:key/connect`
- `POST /businesses/:id/integrations/:key/disconnect`
- `POST /businesses/:id/permissions` — set permissions
- `GET /businesses/:id/permissions` — list permissions
- `POST /businesses/:id/tools/requests` — request tool
- `GET /businesses/:id/tools/audit` — audit history
- `GET /businesses/:id/providers/health` — provider health

**Mission Control:**
- `GET /businesses/:id/mission-control` — snapshot (page exists, wiring unknown)

**Decision Intelligence:**
- `POST /businesses/:id/decisions/generate` — generate decisions
- `GET /businesses/:id/decisions/priorities` — priorities
- `GET /businesses/:id/decisions/optimize` — optimization report
- `GET /decisions/:id/brief` — executive brief
- `POST /decisions/:id/evaluate` — evaluate
- `POST /decisions/:id/schedule` — schedule
- `POST /decisions/:id/measure` — measure outcome
- `POST /decisions/:id/archive` — archive

**Scenarios:**
- `POST /businesses/:id/scenarios` — create scenario
- `GET /businesses/:id/scenarios` — list scenarios
- `POST /businesses/:id/scenarios/compare` — compare scenarios
- `GET /businesses/:id/forecasts` — forecasts

**Execution & Verification:**
- `POST /businesses/:id/plans/:decisionId` — create plan
- `GET /businesses/:id/plans/:decisionId` — get plan
- `POST /businesses/:id/verification/:decisionId` — verify outcome
- `GET /businesses/:id/verification/:decisionId` — get verification

**Operating Loop:**
- `POST /businesses/:id/operating-loop/run` — run loop

**Multi-Agent:**
- `POST /businesses/:id/multi-agent/delegate` — delegate task

**Observability:**
- `GET /metrics` — metrics snapshot

---

## Summary Scores

| Category | Score | Status |
|----------|-------|--------|
| Auth completeness | 0/6 | ❌ No auth UI |
| Frontend page coverage | 3/11 estimated | ❌ MRI entirely missing |
| API endpoint coverage from UI | ~8/65+ | ❌ 85%+ unreachable |
| Type correctness | 3/5 interfaces | ⚠️ 2 field mismatches |
| Mock data eliminated | 0/4 | ❌ All remain |
| Critical bugs fixed | 0/3 | ❌ All unresolved |

**RC1.1 readiness: NOT READY — implementation required across all 10 workstreams.**
