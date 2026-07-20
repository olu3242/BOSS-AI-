# P0 Dashboard Runtime Recovery — Certification Report

Date: 2026-07-20  
Decision: **NO-GO**

## Root cause

The currently aliased Vercel production deployment logged the following failure for `GET /dashboard`:

- PostgreSQL SQLSTATE: `28P01`
- Digest: `4107965740`
- Exception: password authentication failed for database role `postgres`
- First application operation: `requireActiveTenant()` in `apps/web/src/server/auth.ts`
- Failing repository operation: `createPostgresOrganizationRepository().getActive()` in `packages/db/src/repositories/postgres/organizationRepository.ts`

The authenticated session reached the dashboard successfully. Rendering then attempted to resolve the user's active organization. PostgreSQL rejected the `DATABASE_URL` credentials before the API or dashboard data endpoint was called. This is a runtime credential defect, not a React or Server Component defect.

Vercel reports `DATABASE_URL` as configured for Production and Preview, but the account/CLI cannot decrypt sensitive values for inspection. The runtime SQLSTATE is objective evidence that the deployed value is syntactically usable but its credentials are rejected by the target database.

## Additional release blockers discovered

1. Remote commit `8d5f594` failed its production build at `apps/api/src/http/auth.ts:124` because `jwtSecret` was undefined.
2. The web client calls `GET /api/v1/dashboard`, but the API router did not implement that route.
3. Native Supabase access tokens do not contain the application's custom `org_id` claim. The web sends a trusted tenant selection header, but the API previously rejected it without verifying database membership.
4. The remote dashboard patch converted tenant-resolution exceptions into rendered fallback data. That would conceal configuration and database failures instead of fixing them.
5. Migration `0046_platform_super_admins.sql` exists in source, but its production application state cannot be certified while database authentication is unavailable.

## Fixes implemented locally

- Super-admin JWT verification now uses the canonical JWKS/symmetric verification function.
- Native Supabase tokens can use `x-organization-id` only after the verified token subject is confirmed as an active organization member in Postgres.
- Added the missing tenant-scoped dashboard aggregation service and authenticated `/api/v1/dashboard` route.
- Added dashboard aggregation and HTTP contract regression tests.
- Session rejection is distinguished from configuration/runtime failure; only an invalid session becomes an unauthenticated result. Other exceptions propagate.
- Tenant and API failures are logged with trace context and rethrown to the dashboard error boundary.
- The client error boundary exposes only the request digest, not server exception contents or stack traces.
- The dashboard is explicitly dynamic and does not attempt static generation.
- Runtime configuration examples use one canonical, URL-encoded Supabase Transaction Pooler form.

## Dashboard data dependencies

| Dashboard field | Source |
| --- | --- |
| Active organization | `user_tenant_preferences`, `organization_memberships`, `organizations` |
| Business count/name | `businesses` |
| Health distribution/top alerts | `business_health` |
| Recent decisions | `business_decisions` |
| Pending approvals | generated/reviewed decisions plus proposed recommendations |
| Revenue at risk | overdue invoices, converted from cents to currency units |

All dashboard aggregation queries are constrained by the verified organization ID.

## Validation evidence

- Production Vercel logs: exact `28P01` exception, stack, and digest recovered.
- Latest failed deployment build log: exact undefined `jwtSecret` compile failure recovered.
- API typecheck: passed.
- Web typecheck: passed.
- API/web lint: passed with zero warnings.
- Full monorepo build: passed once after the code fixes (23/23 tasks).
- A subsequent cached build compiled successfully but encountered stale `.next` page-collection output for `/_not-found`; a clean artifact retry requires explicit approval because automated execution limits blocked deletion.
- Targeted test execution could not start because isolated worker execution was denied after the environment reached its automated execution limit. The tests are present but must still be run.

## Required production actions

1. Replace Vercel `DATABASE_URL` with the exact Supabase Transaction Pooler URL from the owning Supabase project. URL-encode the password. Do not reconstruct or guess it.
2. Set the same verified database connection for the Railway API environment.
3. Apply and verify every migration through `0046_platform_super_admins.sql`.
4. Run the full test suite and a clean build.
5. Deploy the corrected commit to Vercel and Railway.
6. Certify registration, login, dashboard, refresh, protected routes, logout, and login again using a real production test account.
7. Confirm `/api/v1/dashboard` returns `200` with the expected schema and that Vercel/Railway logs contain no `401`, `403`, `500`, database, migration, or identity errors.

Production remains **NO-GO** until all seven actions have objective runtime evidence.
