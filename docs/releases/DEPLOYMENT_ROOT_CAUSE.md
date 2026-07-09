# Deployment Root Cause

Date: 2026-07-08

## Root Cause

The Vercel project `eduradiusllc/boss-ai` is linked to the wrong root directory.

Current remote root:

```text
apps
```

Correct root:

```text
apps/web
```

## Why It Fails

The install command is correct only when executed from `apps/web`:

```text
cd ../.. && pnpm install --frozen-lockfile
```

From `apps/web`, `cd ../..` reaches the repository root.

From `apps`, `cd ../..` exits the repository:

```text
/vercel/path0/apps -> cd ../.. -> /vercel
```

There is no `package.json` at `/vercel`, so pnpm fails:

```text
ERR_PNPM_NO_PKG_MANIFEST No package.json found in /vercel
```

## Affected Configuration

Remote Vercel project settings:

- Root Directory
- Framework Preset
- Output Directory interpretation
- Install/build command working directory

## Not Affected

No evidence implicates:

- TypeScript
- ESLint
- pnpm lockfile
- application build scripts
- business logic
- database schema
- authentication flow
- API runtime

## Minimal Fix

Change only Vercel project settings:

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
```

No application code change is justified by the evidence.
