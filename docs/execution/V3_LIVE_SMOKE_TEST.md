# BOSS V3 — Live Production Smoke Test Plan

**Date:** 2026-07-24  
**Status:** PENDING — requires manual execution against deployed environment  
**Environment:** Production (Vercel + Render + Supabase)

---

## Prerequisites

Before executing:
- [ ] Migration 0047 applied in Supabase
- [ ] Custom access token hook registered in Supabase Auth
- [ ] `ANTHROPIC_API_KEY` set in Render environment
- [ ] Render redeploy completed and `/health` returns 200

---

## Test Execution Matrix

| Stage | Test | Expected | Evidence Required |
|---|---|---|---|
| **Infrastructure** | `GET https://boss-ai-ppme.onrender.com/health` | `200 { "status": "ok" }` | Response body screenshot |
| **Infrastructure** | `GET https://boss-ai-ppme.onrender.com/metrics/prometheus` | `200 text/plain` | Response excerpt |
| **Infrastructure** | Vercel preview URL loads | `200` HTML page | Browser screenshot |
| **Landing** | Visit `/` | Page loads, nav present | Screenshot |
| **Landing** | Visit `/features` | Feature groups render | Screenshot |
| **Landing** | Visit `/pricing` | Three tier cards render | Screenshot |
| **Landing** | Visit `/legal/privacy` | Privacy policy renders | Screenshot |
| **Landing** | Visit `/legal/terms` | Terms render | Screenshot |
| **Auth Guard** | Visit `/dashboard` unauthenticated | Redirect to `/auth/sign-in` | URL in browser |
| **Sign-Up** | Register new email | Supabase sends verification email | Email received |
| **Email Verify** | Click verification link | Session established, redirect to `/onboarding/organization` | URL in browser |
| **Org Creation** | Submit org name | POST `/api/organizations` → 201, redirect to `/onboarding/setup` | Network tab |
| **Onboarding** | Complete 7-step wizard | POST `/api/v1/businesses` → 201, Step 7 shows | Network tab + screenshot |
| **Business MRI** | Navigate to workspace | MRI "in progress" banner visible | Screenshot |
| **Business MRI** | Wait for MRI completion | Workspace renders health score | Screenshot |
| **Dashboard** | Navigate to `/dashboard` | Stats render, no error boundary | Screenshot |
| **Mission Control** | Navigate to `/business/:id/mission-control` | Timeline shows MRI event | Screenshot |
| **AI Workforce** | Select CFO agent, submit prompt | 200 with analysis text | Response body |
| **Sign-Out** | Click sign out | Session cleared, redirect to `/` or `/auth/sign-in` | URL in browser |
| **Auth Guard Post-Logout** | Visit `/dashboard` after sign-out | Redirect to `/auth/sign-in` | URL in browser |

---

## Failure Documentation Template

For any stage that fails, record:

```
Stage:           [Name from matrix above]
URL:             [Exact URL]
Request:         [Method + body if applicable]
Controller:      [API route / page component]
Status:          [HTTP status or browser error]
Error message:   [Exact text]
Correlation ID:  [x-trace-id header value]
Stack trace:     [If available in Render logs]
Root cause:      [Diagnosis]
Fix applied:     [Commit SHA or manual action]
Verification:    [Re-test result after fix]
```

---

## Render Health Check

Execute:
```bash
curl -s https://boss-ai-ppme.onrender.com/health | jq .
```

Expected:
```json
{
  "status": "ok",
  "version": "0.9.0-rc1",
  "checks": {
    "api": "ok",
    "errorRate": "0.0%",
    "heapMb": 80,
    "uptimeMs": 12345
  }
}
```

---

## Certification Decision

**PENDING.** Smoke test plan is documented. Execution requires the three manual operational steps to be completed first (migration 0047, hook registration, ANTHROPIC_API_KEY). Results must be recorded in this document with evidence screenshots before this gate closes.
