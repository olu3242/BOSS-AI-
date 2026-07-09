# RC15G Web Deployment

Date: 2026-07-08

## Result

Status: NO-GO.

The dedicated Vercel web project was created and linked, but the Preview deployment is not certified. The deployment failure is caused by Vercel project provisioning/configuration, not by application business logic.

No feature code, business logic, application routes, database code, or package scripts were modified for RC15G.

## Project Provisioning

| Item | Required | Observed |
| --- | --- | --- |
| Vercel project | `boss-ai-web` | `boss-ai-web` exists |
| Project ID | n/a | `prj_QVRc6hx6T2xgXl2DzfuKt0NIW9QY` |
| Owner | Eduradius LLC | Eduradius LLC |
| Framework | Next.js | Next.js |
| Root Directory | `apps/web` | `.` |
| Node.js | compatible with repo engines | `24.x` |
| Preview env vars | required web runtime vars populated | none configured |

Evidence:

```text
> Found Project eduradiusllc/boss-ai-web
ID                  prj_QVRc6hx6T2xgXl2DzfuKt0NIW9QY
Name                boss-ai-web
Root Directory      .
Node.js Version     24.x
Framework Preset    Next.js
Build Command       cd ../.. && pnpm --filter @boss/web... build
Output Directory    .next
Install Command     cd ../.. && pnpm install --frozen-lockfile
```

## Architecture Evidence

Repository root:

```text
C:\Cdev\BOSS AI\BOSS-AI
```

Workspace:

```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "industry-packs/*"
```

Web application package:

```json
{
  "name": "@boss/web",
  "scripts": {
    "build": "next build"
  },
  "dependencies": {
    "next": "^15.5.19",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}
```

The deployable user-facing app is `apps/web`. The existing `boss-ai-api` project is rooted at `apps/api` and is not the user-facing Next.js application.

## Deployment Attempt

Preview deployment was attempted from `apps/web` after linking `eduradiusllc/boss-ai-web`.

Deployment URL:

```text
https://boss-ai-lc24dv7f4-eduradiusllc.vercel.app
```

Inspect URL:

```text
https://vercel.com/eduradiusllc/boss-ai-web/GNdGcSUdNp7U7cW8G1NXTKhcFC4K
```

Build result:

```text
status ● Error
```

Build log evidence:

```text
Downloading 149 deployment files...
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
Already up-to-date
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file.
```

## Root Cause

The `boss-ai-web` project exists, but it is not yet correctly provisioned as the Git-backed monorepo web deployment.

The project Root Directory is currently `.`. For the BOSS monorepo, the required Root Directory is:

```text
apps/web
```

The deployment uploaded only 149 files and Vercel could not identify the Next.js package dependency during build. That is consistent with a project/root upload mismatch, not with a missing `next` dependency in the repository.

## Environment Variable Status

Preview environment variables for `boss-ai-web` are empty:

```text
> No Environment Variables found for eduradiusllc/boss-ai-web
```

Required web runtime variables identified from repository evidence include:

| Variable | Required For | Status |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser Supabase client | missing |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser Supabase client | missing |
| `NEXT_PUBLIC_API_BASE_URL` | API proxy/client calls | missing |
| `SUPABASE_URL` | server-side auth runtime fallback | missing |
| `SUPABASE_ANON_KEY` | server-side identity provider | missing |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side auth operations | missing |
| `BOSS_AUTH_CALLBACK_URL` | auth callback URL | missing |
| `BOSS_PASSWORD_RESET_URL` | password reset redirect | missing |
| `DATABASE_URL` | Postgres runtime used by imported API modules | missing |
| `SUPABASE_JWT_SECRET` or Supabase JWKS config | production API/auth verification | missing or not verified |

Secret values were not exposed in this report.

## Operator Remediation

Required actions in Vercel Dashboard or with an authenticated project-settings API token:

1. Configure `boss-ai-web` as the Git-backed project for `https://github.com/olu3242/BOSS-AI-`.
2. Set Root Directory to `apps/web`.
3. Keep Framework Preset as `Next.js`.
4. Prefer Vercel defaults for install and build after the Root Directory is corrected.
5. Populate Preview environment variables for the web runtime.
6. Redeploy Preview from the Git-backed project.

The existing app-local `apps/web/vercel.json` contains schema-valid custom install/build commands. Per RC15G direction, those commands should be treated as provisional and retained only if deployment logs prove Vercel defaults cannot resolve the pnpm workspace after Root Directory is corrected.

## Certification Decision

NO-GO.

The web deployment cannot be certified until:

- `boss-ai-web` Root Directory is `apps/web`.
- Preview environment variables are populated.
- Preview build succeeds.
- Homepage and auth routes return HTTP 200.
- Runtime logs show no startup exceptions.
- No `FUNCTION_INVOCATION_FAILED` errors occur.

## Regression Evidence

Local regression gates were rerun after the RC15G documentation-only changes:

```text
pnpm lint       PASS
pnpm typecheck  PASS
pnpm test       PASS
pnpm build      PASS
```

The local production build confirmed `@boss/web` builds successfully with Next.js 15.5.19. This further supports that the live Vercel failure is a project/root provisioning defect, not a source build defect.
