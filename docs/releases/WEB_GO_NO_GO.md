# Web Go / No-Go

Date: 2026-07-08

## Decision

NO-GO.

The BOSS web deployment must not be promoted. The dedicated web project exists, but it is not yet correctly configured for the monorepo and has no Preview environment variables.

## Blocking Defects

### Blocker 1: Web Project Root Directory

Severity: Critical

Affected project:

```text
eduradiusllc/boss-ai-web
```

Observed:

```text
Root Directory .
```

Required:

```text
Root Directory apps/web
```

Impact:

Vercel cannot reliably locate the Next.js web package and workspace dependencies. The Preview build failed with:

```text
No Next.js version detected.
```

Required operator action:

Set the Vercel project Root Directory to `apps/web` for `boss-ai-web`.

### Blocker 2: Missing Preview Environment Variables

Severity: Critical

Observed:

```text
No Environment Variables found for eduradiusllc/boss-ai-web
```

Impact:

Even after a successful build, runtime auth, Supabase, API connectivity, password reset, and protected routes cannot be certified without environment configuration.

Required operator action:

Populate Preview variables for Supabase, API base URL, auth callback URL, password reset URL, database connectivity, and required provider integrations. Do not expose secret values in reports.

### Blocker 3: Preview Deployment Failed Before Runtime

Severity: High

Observed:

```text
status ● Error
```

Impact:

The following Definition of Done items remain unverified:

- Homepage HTTP 200
- Login page load
- Signup page load
- Runtime initialization
- Middleware load
- Server action initialization
- Client bundle load
- No `FUNCTION_INVOCATION_FAILED`
- Runtime logs without startup exceptions

Required operator action:

Redeploy after correcting Root Directory and env vars, then perform browser and runtime validation.

## Accepted Evidence

Repository evidence:

- Web app package: `apps/web/package.json`
- Web app package name: `@boss/web`
- Next.js dependency: `next`
- Workspace root: repository root
- Workspace package globs: `apps/*`, `packages/*`, `industry-packs/*`

Vercel evidence:

- Project exists: `boss-ai-web`
- Framework: `Next.js`
- Root Directory currently: `.`
- Preview env vars: none
- Failed deployment URL: `https://boss-ai-lc24dv7f4-eduradiusllc.vercel.app`

## Next Gate

RC15G remains open operationally until a Preview deployment succeeds.

After Preview succeeds, proceed to RC15H for live authentication and end-to-end certification:

- Email signup
- Email login
- Google OAuth
- Password reset
- Logout
- Session persistence
- Session refresh
- Protected routes
- Dashboard workflows

## Final Recommendation

NO-GO for promotion.

The exact remediation is infrastructure-only: configure the correct Vercel project root, populate Preview environment variables, redeploy, and validate live routes.

## Regression Evidence

Local gates after RC15G:

```text
pnpm lint       PASS
pnpm typecheck  PASS
pnpm test       PASS
pnpm build      PASS
```
