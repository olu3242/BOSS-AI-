# Vercel Configuration Certification

Date: 2026-07-08

## Certification Result

Current Vercel project configuration is not certified.

The repository contains a valid app-local Vercel configuration at `apps/web/vercel.json`, but the remote Vercel project is configured to use `apps` as its root.

## Repository Evidence

`pnpm-workspace.yaml` declares app packages under `apps/*`.

`apps/web/package.json` proves `apps/web` is the Next.js app:

- package name: `@boss/web`
- dependency: `next`
- build script: `next build`

`apps/api/package.json` proves `apps/api` is a Node/Express API package, not the Vercel Next app:

- package name: `@boss/api`
- build script: `tsc -p tsconfig.json`
- start script: `node dist/server.js`

`apps/web/vercel.json` is internally consistent with `apps/web` as root:

- install command moves from `apps/web` to repo root with `cd ../..`
- build command runs `pnpm --filter @boss/web... build` from repo root
- output directory is `.next` relative to `apps/web`

## Current Remote Settings

Observed via Vercel CLI:

```text
Project: eduradiusllc/boss-ai
Root Directory: apps
Framework Preset: Node
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
Node.js Version: 24.x
```

## Certified Required Settings

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
Node.js Version: 24.x
```

## Why Defaults Alone Are Not Certified

Vercel defaults are insufficient for this repository because `@boss/web` depends on workspace packages outside `apps/web`. The install and build commands must run from the monorepo root so pnpm can resolve workspace dependencies.

The existing `apps/web/vercel.json` already encodes that requirement with `cd ../..`.

## Notes

The root `vercel.json` contains a `projects` property that current Vercel CLI rejects when deploying from the repository root. The active app-local configuration is `apps/web/vercel.json`; remote project settings must target that app root.
