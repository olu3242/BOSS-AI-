# RC15D Deployment Report

Date: 2026-07-08

## Result

Status: BLOCKED - staging deployment is not certified.

The repository remains locally validated, but Vercel preview deployment fails before runtime because the Vercel project is configured with the wrong application root.

## Local Baseline

The following commands passed before deployment work began:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

The regression stack was rerun after report generation and still passed:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Vercel Project Audit

Project: `eduradiusllc/boss-ai`

Observed settings:

- Root Directory: `apps`
- Framework Preset: `Node`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm --filter @boss/web... build`
- Output Directory: `.next`
- Node.js Version: `24.x`
- Local linkage: `apps/web` linked to `eduradiusllc/boss-ai`

Expected settings:

- Root Directory: `apps/web`
- Framework Preset: `Next.js`
- Install Command: `cd ../.. && pnpm install --frozen-lockfile`
- Build Command: `cd ../.. && pnpm --filter @boss/web... build`
- Output Directory: `.next`
- Node.js Version: `24.x` is acceptable for current Vercel project, although repo engines allow `>=22.13.0`

## Deployment Attempts

### Attempt 1

Preview URL: `https://boss-219ibvw31-eduradiusllc.vercel.app`

Result: FAILED

Failure:

```text
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
ERR_PNPM_NO_PKG_MANIFEST No package.json found in /vercel
Error: Command "cd ../.. && pnpm install --frozen-lockfile" exited with 1
```

Root cause: Vercel executed from `/vercel/path0/apps`; `cd ../..` resolved to `/vercel`, outside the checked-out repository.

### Attempt 2

Preview URL: `https://boss-qsty8dswn-eduradiusllc.vercel.app`

Result: FAILED

Failure:

```text
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies".
```

Root cause: Vercel still treated `apps` as the project root. The `next` dependency is declared in `apps/web/package.json`, not in `apps/package.json`.

## Required Remediation

Update the Vercel project settings:

1. Set Root Directory to `apps/web`.
2. Set Framework Preset to `Next.js`.
3. Keep Install Command as `cd ../.. && pnpm install --frozen-lockfile`.
4. Keep Build Command as `cd ../.. && pnpm --filter @boss/web... build`.
5. Keep Output Directory as `.next`.
6. Redeploy preview.

## Certification

RC15D staging certification is blocked until the Vercel project root/framework settings are corrected and a preview deployment reaches READY.
