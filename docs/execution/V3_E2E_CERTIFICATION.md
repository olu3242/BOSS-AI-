# BOSS V3 — E2E Test Certification

**Date:** 2026-07-24  
**Status:** NOT STARTED — critical path documented for implementation

---

## Current State

No Playwright E2E tests exist. Unit and integration tests pass (CI green). E2E coverage is a post-MVP requirement.

---

## Critical Path to Cover

### Path 1: New User Onboarding (P0)

```
1. Navigate to /auth/sign-up
2. Enter email + password → submit
3. Verify email (intercept Supabase email link in test)
4. Redirected to /onboarding/organization
5. Enter business name → submit
6. Redirected to /onboarding/setup
7. Complete 7-step wizard:
   a. Business name + industry
   b. Profile (structure, employees, revenue, locations)
   c. Operating hours (select days + times)
   d. Services description
   e. Tool stack selection
   f. AI workforce selection → submit (triggers business creation)
   g. Launch confirmation → click "Go to Workspace"
8. Redirected to /business/:id/workspace
9. Verify MRI "in progress" banner appears
10. Wait for MRI completion (or mock)
11. Verify workspace renders business data
```

### Path 2: Returning User Sign-In (P0)

```
1. Navigate to /auth/sign-in
2. Enter email + password → submit
3. Redirected to /dashboard
4. Verify dashboard renders (skeleton → data)
5. Verify stat tiles show correct values
6. Click on a business in the top alerts → verify navigation
```

### Path 3: Dashboard Empty State (P1)

```
1. Sign in as user with org but no businesses
2. Navigate to /dashboard
3. Verify EmptyState "Add Your First Business" CTA is shown
4. Click CTA → verify navigation to /onboarding/setup
```

### Path 4: Auth Guard (P1)

```
1. Navigate to /dashboard without session cookie
2. Verify redirect to /auth/sign-in
3. Navigate to /business/some-id/workspace without session cookie
4. Verify redirect to /auth/sign-in
```

---

## Test Infrastructure Requirements

| Requirement | Notes |
|---|---|
| Playwright | Install `@playwright/test` |
| Chromium | Pre-installed at `/opt/pw-browsers/chromium` (use `executablePath`) |
| Test database | Supabase test project or local Supabase via Docker |
| Test accounts | Seeded via Supabase Admin API before each test run |
| Email verification | Use Supabase test OTP or intercept with `mailhog` |
| CI integration | Add `playwright` step to `.github/workflows/ci.yml` |

---

## Playwright Config Skeleton

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

---

## Certification Decision

**NOT STARTED.** E2E tests are required before the platform can be certified for scaling but are not blocking MVP launch. The critical paths above define the scope for the first E2E sprint.
