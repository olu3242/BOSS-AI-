# Preview Deployment Report

Date: 2026-07-08

## Deployment Target

Project:

```text
eduradiusllc/boss-ai-web
```

Project ID:

```text
prj_QVRc6hx6T2xgXl2DzfuKt0NIW9QY
```

Deployment URL:

```text
https://boss-ai-lc24dv7f4-eduradiusllc.vercel.app
```

Inspect URL:

```text
https://vercel.com/eduradiusllc/boss-ai-web/GNdGcSUdNp7U7cW8G1NXTKhcFC4K
```

## Build Summary

Status:

```text
Error
```

Region:

```text
Washington, D.C., USA (East) - iad1
```

Build machine:

```text
2 cores, 8 GB
```

Key log excerpt:

```text
Retrieving list of deployment files...
Previous build caches not available.
Downloading 149 deployment files...
Running "vercel build"
Vercel CLI 54.21.1
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
Already up-to-date
Warning: Could not identify Next.js version, ensure it is defined as a project dependency.
Error: No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file.
```

## Failure Analysis

The build failed before Next.js compilation.

Observed Vercel project settings:

```text
Root Directory      .
Framework Preset    Next.js
Build Command       cd ../.. && pnpm --filter @boss/web... build
Output Directory    .next
Install Command     cd ../.. && pnpm install --frozen-lockfile
```

Required project settings:

```text
Root Directory      apps/web
Framework Preset    Next.js
```

The repository contains `apps/web/package.json`, and that package declares `next` as a dependency. Vercel did not detect it because the deployment packaging/root configuration is incorrect for the monorepo web app.

## Environment Summary

Preview environment variables:

```text
No Environment Variables found for eduradiusllc/boss-ai-web
```

An attempted non-interactive CLI copy from the API project was not completed because `vercel env add` required a git branch in this CLI flow. No secret values were printed or recorded.

## Remediation

Correct these before the next Preview deployment:

1. Set `boss-ai-web` Root Directory to `apps/web`.
2. Confirm Git integration points to `https://github.com/olu3242/BOSS-AI-`.
3. Prefer default Vercel install/build behavior after root correction.
4. Populate Preview environment variables.
5. Redeploy Preview.

## Preview Result

NO-GO.

Preview did not reach runtime initialization.

## Local Regression

After documenting the Preview failure, the local regression suite was rerun:

```text
pnpm lint       PASS
pnpm typecheck  PASS
pnpm test       PASS
pnpm build      PASS
```

The local build completed and generated the `@boss/web` Next.js route manifest successfully.
