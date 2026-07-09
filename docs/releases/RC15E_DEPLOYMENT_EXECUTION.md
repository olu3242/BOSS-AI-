# RC15E Deployment Execution

Date: 2026-07-08

## Objective

Deploy the locally certified BOSS repository to Vercel Preview and determine the exact deployment blocker without changing product code.

## Repository Discovery

Workspace root: repository root.

Package manager:

- `packageManager`: `pnpm@11.3.0`
- Workspace file: `pnpm-workspace.yaml`
- Workspace packages:
  - `apps/*`
  - `packages/*`
  - `industry-packs/*`

Root scripts:

- `build`: `turbo run build`
- `lint`: `turbo run lint`
- `typecheck`: `turbo run typecheck`
- `test`: `turbo run test`

Deployable applications:

- `apps/web`
  - Package: `@boss/web`
  - Framework dependency: `next`
  - Build script: `next build`
  - Vercel config: `apps/web/vercel.json`
- `apps/api`
  - Package: `@boss/api`
  - Runtime: Express/Node
  - Build script: `tsc -p tsconfig.json`
  - Used as a workspace dependency by `@boss/web`

Dependency map for deployment:

```text
@boss/web
  -> @boss/api
  -> @boss/shared
  -> @boss/types
  -> @boss/ui
  -> Next.js 15.5.19

@boss/api
  -> @boss/db
  -> @boss/events
  -> @boss/industry-pack-general-smb
  -> @boss/loop
  -> @boss/mcp
  -> @boss/registries
  -> @boss/shared
  -> @boss/types
```

## Vercel Compatibility Audit

Relevant repository files:

- Root `vercel.json` contains a legacy-looking `projects` array pointing at `apps/web`.
- `apps/web/vercel.json` contains valid app-local settings:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && pnpm --filter @boss/web... build",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "outputDirectory": ".next"
}
```

The app-local config is consistent with `apps/web` as the Vercel root:

- From `apps/web`, `cd ../..` reaches the monorepo root.
- The monorepo root contains `package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml`.
- `@boss/web` contains the `next` dependency and `next build` script.
- Next output is `apps/web/.next`, represented as `.next` relative to the app root.

## Vercel Project Settings Observed

Project: `eduradiusllc/boss-ai`

Observed via `vercel project inspect boss-ai`:

```text
Root Directory: apps
Framework Preset: Node
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
Node.js Version: 24.x
```

Pulled local project settings also show:

```json
{
  "framework": "node",
  "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
  "buildCommand": "cd ../.. && pnpm --filter @boss/web... build",
  "outputDirectory": " .next",
  "rootDirectory": "apps",
  "nodeVersion": "24.x"
}
```

## Deployment Attempts

### Attempt 1: Repository Root Deploy

Command:

```text
vercel deploy --yes
```

Result: failed before build.

Evidence:

```text
The vercel.json file should be inside of the provided root directory.
Error: Invalid vercel.json - should NOT have additional property `projects`.
```

Interpretation: the root `vercel.json` is not valid under current Vercel project config schema. This is not the active app-local config and does not change the verified app root conclusion.

### Attempt 2: App Path With App-Local Config

Command:

```text
vercel deploy apps/web --yes --local-config apps/web/vercel.json
```

Preview URL:

```text
https://boss-486hvjp4d-eduradiusllc.vercel.app
```

Result: failed during install.

Evidence:

```text
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
ERR_PNPM_NO_PKG_MANIFEST No package.json found in /vercel
```

Interpretation: even when deploying the verified app path, the linked Vercel project still executes as if the configured project root is `apps`.

### Attempt 3: Local Vercel Build From App Root

Command:

```text
vercel build --yes --local-config vercel.json
```

Run from:

```text
apps/web
```

Result: failed during install.

Evidence:

```text
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
No package.json found in C:\Cdev\BOSS AI
```

Interpretation: local Vercel build also uses the pulled project root `apps`, proving the blocker is stored Vercel project metadata.

## Result

Status: VERIFIED BLOCKER.

Deployment cannot be certified from the repository until the Vercel project root/framework settings are corrected.

## Regression

After RC15E report generation, local release gates were rerun:

- `pnpm lint` - PASS
- `pnpm typecheck` - PASS
- `pnpm test` - PASS
- `pnpm build` - PASS

## Required Operator Action

In Vercel project `eduradiusllc/boss-ai`, update:

```text
Root Directory: apps/web
Framework Preset: Next.js
Install Command: cd ../.. && pnpm install --frozen-lockfile
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
```

Then redeploy Preview and continue runtime certification.
