# RC1 Release Notes

Status: **TAG DEFERRED**

Candidate source baseline: `72c35fa52692b7eb81688852f9f5a48460ec5521`

Intended tag: `v1.0.0-rc1`

## Highlights

- Converged the platform foundation and RC1–RC9 production runtime.
- Added durable tenant-scoped identity, runtime, event, scheduler, graph, and
  business-context persistence.
- Integrated the Decision OS, Executive Workspace, automation, provider,
  analytics, support, and customer-success flows.
- Consolidated all Next.js routes into one canonical App Router root.
- Upgraded to Next.js 15.5.19 and aligned CI on Node 24/pnpm 11.3.

## Validation

All source gates pass: frozen install, lint, typecheck, 800 tests, production
build, architecture boundaries, dead-code analysis, focused scenario smoke,
live HTTP route smoke, and high-severity production dependency audit.

## Breaking changes

No public API contract break was introduced by the release stabilization work.
The runtime requirement is now Node `>=22.13.0`; CI uses Node 24.

## Migration notes

Apply database migrations in strict order from `0001` through `0023`. Validate
tenant RLS using non-privileged roles before enabling production traffic.

## Known issues

- Production environment values are not present in this checkout.
- No live staging database migration evidence is available.
- Durable external secret/KMS storage is not certified.
- The Next.js ESLint plugin-detection warning remains non-blocking.

The annotated release tag is withheld until the production-readiness gates are
closed.
