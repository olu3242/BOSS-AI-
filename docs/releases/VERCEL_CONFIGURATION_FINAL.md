# Vercel Configuration Final

Date: 2026-07-08

## Final Repository Configuration

Root `vercel.json`:

```json
{
  "version": 2
}
```

Web app `apps/web/vercel.json`:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm --filter @boss/web... build",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "outputDirectory": ".next"
}
```

## Why This Matches The Monorepo

The repository root contains:

- root `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `turbo.json`

The deployable Next.js app is:

```text
apps/web
```

The `apps/web/vercel.json` commands intentionally move from `apps/web` to the repository root:

```text
cd ../..
```

That is required so pnpm can resolve workspace dependencies and Turbo can build `@boss/web` plus its dependencies.

## Dashboard Versus vercel.json

Vercel Dashboard must provide the project Root Directory. `rootDirectory` is not an allowed `vercel.json` property, so it must not be encoded in repository `vercel.json`.

Required web project setting:

```text
Root Directory: apps/web
```

Framework/build/install/output can be provided either in Vercel project settings or in the app-local `apps/web/vercel.json`. In this repository, app-local `apps/web/vercel.json` already provides valid framework/build/install/output settings that match the monorepo.

Recommended web project settings:

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
```

If Vercel honors `apps/web/vercel.json`, the dashboard can omit duplicate framework/build/install/output overrides, but Root Directory must still be set to `apps/web`.

## Current External Vercel State

Visible Vercel project:

```text
boss-ai-api
```

Observed settings:

```text
Root Directory: apps/api
Framework Preset: Node
Build Command: None
Output Directory: None
Install Command: default package-manager install
```

That project does not represent the `apps/web` Next.js deployment target. A web deployment project must target `apps/web`.

## Definition Of Done Evidence

- Every active `vercel.json` validates: PASS
- No unsupported properties remain in active `vercel.json`: PASS
- `"projects"` no longer exists in active `vercel.json`: PASS
- Repository structure preserved: PASS
- Business logic unchanged: PASS
- Database code unchanged: PASS
- Application code unchanged: PASS
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: PASS
- `pnpm build`: PASS
