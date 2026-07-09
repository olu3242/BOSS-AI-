# Runtime Root Cause Analysis

Date: 2026-07-08

## Status

No deployed runtime was reached. The first root cause occurs during Vercel build setup.

## Primary Root Cause

The Vercel project root is configured as `apps`, while the deployable Next.js application lives in `apps/web`.

This causes two distinct failures:

1. The configured install command `cd ../.. && pnpm install --frozen-lockfile` exits the checkout and lands in `/vercel`.
2. When the install path is made viable from `apps`, Vercel still cannot detect Next.js because `apps/package.json` does not contain `next`; `apps/web/package.json` does.

## Evidence

Failed preview:

- `https://boss-219ibvw31-eduradiusllc.vercel.app`
- Build failure: `ERR_PNPM_NO_PKG_MANIFEST No package.json found in /vercel`

Second failed preview:

- `https://boss-qsty8dswn-eduradiusllc.vercel.app`
- Build failure: `No Next.js version detected`

## Affected Configuration

Vercel project: `eduradiusllc/boss-ai`

Current:

- Root Directory: `apps`
- Framework Preset: `Node`

Required:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`

## Code Defect Assessment

No business-logic defect is confirmed.

No application stack trace, route exception, `FUNCTION_INVOCATION_FAILED`, or runtime module failure was observed because deployment did not reach runtime.

## Required Fix

Correct the Vercel project settings in the dashboard or with a valid Vercel project-settings API token:

- `rootDirectory = apps/web`
- `framework = nextjs`

Then redeploy and continue runtime validation.
