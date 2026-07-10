# P0 Google OAuth Sign-In Loop Report

Date: 2026-07-09

## Root Cause

The deployed `boss-ai-web` Vercel project had only the browser Supabase variables configured:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The server-side identity runtime used by `POST /api/auth/session` required only:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

As a result, Google OAuth could complete in the browser, but the server session handoff failed before `writeSessionCookies()` could persist the `boss_access_token` and `boss_refresh_token` cookies. Middleware then redirected protected routes back to `/auth/sign-in`.

## Evidence

Vercel environment inventory for `eduradiusllc/boss-ai-web` showed:

- Present: `NEXT_PUBLIC_SUPABASE_URL`
- Present: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Missing: `SUPABASE_URL`
- Missing: `SUPABASE_ANON_KEY`
- Missing: `DATABASE_URL`

Code evidence before the fix:

- `apps/web/app/auth/callback/page.tsx` exchanged the OAuth code successfully, then posted tokens to `/api/auth/session`.
- `apps/web/app/api/auth/session/route.ts` called `createBrowserIdentityServices()`.
- `apps/web/src/server/auth.ts` called `SupabaseIdentityProvider.fromEnvironment()`.
- `apps/api/src/supabaseIdentityProvider.ts` required `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

Controlled runtime probe evidence:

- `POST /api/auth/session` against the preview returned a Vercel deployment protection `401` before application code executed.
- Response included `vercel_auth_enabled: true` and `auto_vercel_auth_redirect: true`.

## Hotfix

Updated `SupabaseIdentityProvider.fromEnvironment()` to accept the Next.js public Supabase variables as server fallbacks:

```ts
const url = env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

This matches the existing fallback pattern in `apps/api/src/http/auth.ts` and allows the web server runtime to verify Supabase access tokens using the variables already configured in Vercel.

## Files Modified

- `apps/api/src/supabaseIdentityProvider.ts`
- `apps/api/src/__tests__/identityRuntime.test.ts`

## Regression Test

Added a regression test proving the identity provider can initialize from:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Focused test:

```text
pnpm --filter @boss/api test -- src/__tests__/identityRuntime.test.ts
PASS: 4 tests
```

## Authentication Pipeline Status

| Stage | Status | Evidence |
| --- | --- | --- |
| Google OAuth request starts | UNKNOWN | Requires browser account interaction |
| Google returns authorization code | UNKNOWN | Requires browser account interaction |
| `exchangeCodeForSession()` succeeds | UNKNOWN | User-reported symptom indicates Google/Supabase likely succeeds |
| Supabase session exists | UNKNOWN | Requires live OAuth callback observation |
| Access token exists | UNKNOWN | Requires live OAuth callback observation |
| Refresh token exists | UNKNOWN | Requires live OAuth callback observation |
| `POST /api/auth/session` executes | BLOCKED | Preview deployment protection returned 401 before app code |
| `identity.verifySession()` executes | PREVIOUSLY BLOCKED | Missing server Supabase env aliases |
| `identity.verifySession()` succeeds | READY FOR RETEST | Fallback hotfix implemented |
| `writeSessionCookies()` executes | READY FOR RETEST | Depends on successful live handoff |
| Browser stores cookies | UNKNOWN | Requires browser E2E after deploy/protection fix |
| Middleware receives cookies | UNKNOWN | Requires browser E2E after deploy/protection fix |
| Dashboard loads | BLOCKED | `DATABASE_URL` missing in Vercel env inventory |

## Cookie Audit

Cookie names:

- `boss_access_token`
- `boss_refresh_token`
- `boss_persistent_session`

Cookie settings:

- `HttpOnly: true`
- `SameSite: lax`
- `Secure: true` in production
- `Path: /`
- Domain omitted, so cookies are host-only for the deployed app origin

Middleware checks the same names:

- `ACCESS_COOKIE`
- `REFRESH_COOKIE`

No cookie-name mismatch was found.

## Middleware Audit

Middleware protects:

- `/dashboard/:path*`
- `/onboarding/:path*`

Middleware allows the request through if either `boss_access_token` or `boss_refresh_token` exists. It redirects to `/auth/sign-in?next=<path>` only when both are absent.

The loop is consistent with cookies never being written, not with a middleware name mismatch.

## Identity Layer Audit

`identity.verifySession()` delegates to Supabase `auth.getUser(accessToken)`.

No evidence was found that it rejects valid tokens by stale claims or local JWT logic. The proven configuration defect was provider initialization failing before token verification because the deployed server runtime did not expose `SUPABASE_URL` / `SUPABASE_ANON_KEY`.

## Remaining Operator Blockers

1. Disable Vercel Authentication protection for the staging URL used for OAuth testing, or use an approved Vercel protection bypass flow. Current preview API probes are intercepted before app code.
2. Add `DATABASE_URL` to `boss-ai-web` Preview and Production. Without it, authenticated dashboard and tenant runtime can still fail after session creation.
3. If preferred, add explicit `SUPABASE_URL` and `SUPABASE_ANON_KEY` aliases in Vercel as defense in depth, even though the code now supports the existing `NEXT_PUBLIC_*` variables.

## Validation

- `pnpm --filter @boss/api test -- src/__tests__/identityRuntime.test.ts`: PASS
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS

## Production Readiness

NO-GO until a live OAuth browser test confirms:

- `/api/auth/session` reaches application code
- `OAUTH_SESSION_COOKIES_WRITTEN` appears in runtime logs
- browser stores `boss_access_token` and `boss_refresh_token`
- `/dashboard` loads
- refresh preserves session
- logout clears session

