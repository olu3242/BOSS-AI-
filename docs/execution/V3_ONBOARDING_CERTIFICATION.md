# BOSS V3 — Onboarding Certification

**Date:** 2026-07-24  
**Status:** CONDITIONAL PASS

---

## Onboarding Flow

```
/auth/sign-up
    │ Supabase creates user + sends verification email
    ▼
/auth/verify (email link)
    │ Supabase confirms user; sets session cookies
    ▼
/onboarding/organization
    │ Form: business name
    │ POST /api/organizations → creates org in DB + sets active org
    ▼
/onboarding/setup (7-step wizard)
    │ Step 1: Business name + industry
    │ Step 2: Profile (structure, employees, revenue, locations)
    │ Step 3: Operating hours
    │ Step 4: Services / products
    │ Step 5: Existing tools
    │ Step 6: AI workforce selection
    │ Step 7: Launch confirmation
    │ On Step 6 submit: POST /api/v1/businesses → creates business + fires business.created event
    ▼
/business/:id/workspace
    │ Auto-MRI triggered by business.created event (PR #10)
    ▼
Dashboard available at /dashboard
```

---

## Component Verification

### `/auth/sign-up` page
- **Status:** ✅ EXISTS
- Form collects email + password
- Calls Supabase Auth `signUp()`
- Sets session cookies on success
- Redirects to `/onboarding/organization`

### `/onboarding/organization` page
- **Status:** ✅ VERIFIED
- Requires authenticated session (`requireBrowserIdentity`)
- Redirects to `/dashboard` if organization already exists (prevents double-create)
- Form POSTs to `/api/organizations`

### `/api/organizations` route handler
- **Status:** ✅ VERIFIED
- Reads session cookie; redirects to sign-in if not authenticated
- Creates organization via `organizations.create()`
- On success: redirects to `/onboarding/setup`
- On error: redirects back with `?error=<message>`

### `/onboarding/setup` page + `OnboardingSetupClient`
- **Status:** ✅ VERIFIED
- 7-step wizard with progress bar
- Industry selector (9 options including general_smb fallback)
- Business profile (type, employees, revenue, years, locations)
- Operating hours with day toggles + time pickers
- Services text area
- Tool stack chip selector (20 common tools)
- AI workforce selector (6 agent types)
- Calls `apiClient.createBusiness()` on step 6 completion
- Shows loading state during API call
- On success: displays Step 7 launch confirmation with link to `/business/:id/workspace`
- On error: inline error message with retry capability

### `business.created` event → Auto-MRI
- **Status:** ✅ IMPLEMENTED (merged in PR #10)
- `JournaledEventBus` emits `business.created` on business creation
- Subscriber calls `mriService.startMri(businessId, orgId)`
- MRI runs asynchronously; user sees "running in background" message

---

## Empty State Handling

| State | Handled | Component |
|---|---|---|
| No organization | ✅ | Redirect to `/onboarding/organization` |
| Organization exists, no business | ✅ | Step 7 links to workspace |
| Business creation fails | ✅ | Inline error + retry |
| MRI timeout | ✅ | Async — UI doesn't block |

---

## Certification Decision

**CONDITIONAL PASS.** The onboarding flow is complete, all states are handled, and auto-MRI is wired. The flow cannot be fully certified end-to-end until:

1. Render API health confirmed (business creation calls the API)
2. Custom access token hook registered (org_id in JWT required for `requireOrgId`)
3. Manual walkthrough: sign-up → verify → name org → complete wizard → reach workspace
