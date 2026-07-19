# Vercel Repository Audit

Date: 2026-07-08

## Result

Status: PASS for corrected Vercel root recognition. PARTIAL for Git-backed production workflow certification.

## Project

```text
eduradiusllc/boss-ai-web
```

Project ID:

```text
prj_QVRc6hx6T2xgXl2DzfuKt0NIW9QY
```

## Current Settings

```text
Root Directory      apps/web
Framework Preset    Next.js
Node.js Version     24.x
Build Command       cd ../.. && pnpm --filter @boss/web... build
Output Directory    .next
Install Command     cd ../.. && pnpm install --frozen-lockfile
```

## Local Project Linkage

Repository root:

```text
C:\Cdev\BOSS AI\BOSS-AI\.vercel\project.json
```

`apps/web`:

```text
C:\Cdev\BOSS AI\BOSS-AI\apps\web\.vercel\project.json
```

Both point to:

```text
boss-ai-web
```

## Failed Deployment Audit

Failed deployment:

```text
https://boss-ai-2s9atsjis-eduradiusllc.vercel.app
```

Failure evidence:

```text
Downloading 149 deployment files...
The specified Root Directory "apps/web" does not exist.
```

Root cause:

The deployment was sourced from `apps/web`, not from the repository root. Since the Vercel project Root Directory was also `apps/web`, Vercel looked for `apps/web` inside the uploaded `apps/web` source.

## Successful Deployment Audit

Successful Preview:

```text
https://boss-ai-mktktx22w-eduradiusllc.vercel.app
```

Evidence:

```text
Downloading 2721 deployment files...
Detected Next.js version: 15.5.19
apps/web build: ✓ Compiled successfully
Deployment completed
status ● Ready
```

The larger file count proves the repository-root source was uploaded and Vercel could resolve `apps/web`.

## Environment Status

Preview environment variables:

```text
No Environment Variables found for eduradiusllc/boss-ai-web
```

This must be remediated before RC15H live authentication or runtime certification.

## Access Control Status

HTTP checks against the Preview URL return Vercel's login page:

```text
Login - Vercel
```

This indicates Preview access protection is active. Browser/runtime validation requires either an authenticated Vercel session or adjusted Preview protection settings.

## Certification Decision

Vercel root-directory recognition is certified after deploying from repository root.

Full Vercel runtime certification is blocked by missing environment variables and Preview access protection.
