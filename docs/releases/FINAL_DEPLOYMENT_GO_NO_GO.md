# Final Deployment Go/No-Go

Date: 2026-07-08

## Decision

NO-GO

Local regression remains green:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Reason

The Vercel preview deployment does not reach READY. The failure is caused by Vercel project configuration, not by a confirmed application code defect.

## Blocking Defect

Severity: Critical

Vercel project `eduradiusllc/boss-ai` is configured with:

- Root Directory: `apps`
- Framework Preset: `Node`

The deployable Next.js app is in `apps/web`.

## Required Remediation

Change Vercel project settings:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm --filter @boss/web... build`
- Output Directory: `.next`

Then run:

1. Preview deploy
2. Homepage HTTP check
3. API/health check
4. Runtime log review
5. Auth validation
6. Browser smoke test
7. Regression stack

## Promotion Criteria

Promotion remains blocked until:

- Preview deployment succeeds
- Homepage returns HTTP 200
- API health endpoint returns healthy
- No startup exceptions appear in runtime logs
- Auth, Google OAuth, password reset, dashboard, and protected route checks pass
- No Critical or High deployment defects remain
