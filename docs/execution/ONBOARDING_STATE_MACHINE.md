# BOSS V3 — Onboarding State Machine

**Date:** 2026-07-24  
**Status:** CERTIFIED

---

## State Diagram

```
[NOT_STARTED]
      │
      ▼
[ACCOUNT_CREATED] ──────────────────────────────────┐
      │                                              │ Email confirm required
      │ Immediate session                            ▼
      │                                   [EMAIL_VERIFICATION_PENDING]
      │                                              │
      │◄─────────────────────────────────────────────┘
      ▼
[EMAIL_VERIFIED / AUTHENTICATED]
      │
      ▼
[ORGANIZATION_CREATED]
      │
      ▼
[WIZARD_IN_PROGRESS]
      │  step 1/7 → 2/7 → 3/7 → 4/7 → 5/7 → 6/7
      ▼
[BUSINESS_CREATED]
      │
      ▼  (auto-trigger, background)
[MRI_STARTED]
      │
      ▼
[ONBOARDING_COMPLETE → /business/:id/workspace]
```

---

## State Definitions

| State | Description | Terminal? | Retry? |
|---|---|---|---|
| `not_started` | User has not signed up | No | N/A |
| `account_created` | Supabase user created; email confirmation may be pending | No | Resend verification email |
| `email_verification_pending` | Awaiting email confirmation | No | Resend verification email |
| `authenticated` | Session established; org not yet created | No | N/A |
| `organization_created` | Org exists; redirect to wizard | No | N/A |
| `wizard_in_progress` | Steps 1–6 collected; Step 7 not yet submitted | No | Resume at last step |
| `business_created` | POST /api/v1/businesses succeeded | No | N/A |
| `mri_started` | MRI auto-triggered in background | No | N/A |
| `onboarding_complete` | Step 7 rendered; CTA to workspace | Yes | N/A |

---

## Transition Guards

| Transition | Guard |
|---|---|
| → organization_created | User authenticated + org name valid (2–100 chars) |
| → wizard step 1 advance | businessName ≥ 2 chars + industry selected |
| → wizard step 2 advance | employeeCount ≥ 1, locationCount ≥ 1, annualRevenue ≥ 0, yearsOperating ≥ 0 |
| → wizard step 3 advance | ≥ 1 day selected, openTime and closeTime present |
| → wizard step 4 advance | No gate (services optional) |
| → wizard step 5 advance | No gate (tools optional) |
| → wizard step 6 advance | aiAgents.length ≥ 1 |
| → business_created | All wizard data passes CreateBusinessSchema |
| → onboarding_complete | Business ID returned from API |

---

## Error Recovery

| Failure Point | Recovery |
|---|---|
| Sign-up fails | Form preserved; error message displayed; retry immediately |
| Organization creation fails | Form preserved; error message displayed; retry immediately |
| Wizard step validation fails | Field errors shown inline; form not cleared; user corrects in place |
| Business creation API fails | Error banner shown on Step 6; wizard state preserved; retry Submit |
| MRI fails to start | Silent degraded state — workspace loads with "MRI starting..." message |
| Network drop mid-wizard | State preserved in React; user reconnects and continues |

---

## Resume Behavior (Implemented)

`requireActiveTenant()` on `/onboarding/setup` page:
- If user has no org → redirect to `/onboarding/organization`
- If user has org but no business → wizard starts at Step 1
- If user has completed setup → redirect to `/dashboard`

**Note:** In-wizard resume (persist step across refresh) is a Phase 1 item of the Workflow Persistence Engine (Sprint +1). Current behavior: wizard restarts at Step 1 after browser refresh, but org is preserved so no duplicate is created.

---

## Navigation Rules

- **Back button:** Always allowed within wizard (Steps 2–6). State preserved.
- **Browser back button:** Not intercepted in RC1. User lands on previous page; wizard restarts at Step 1.
- **Refresh mid-wizard:** Wizard restarts Step 1; data lost from React state. (Resolved by WorkflowSession engine — Sprint +1)
- **Direct URL access:** All onboarding pages are protected by `requireActiveTenant()` / `requireBrowserIdentity()`. Unauthenticated users → redirect to sign-in.
