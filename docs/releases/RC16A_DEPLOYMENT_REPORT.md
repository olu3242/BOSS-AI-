# RC16A Deployment Report

Date: 2026-07-08

## Result

Status: DEPLOYED TO PREVIEW. Runtime certification remains PARTIAL due to Preview protection and missing env vars.

Preview URL:

```text
https://boss-ai-4wptz86z8-eduradiusllc.vercel.app
```

Inspect URL:

```text
https://vercel.com/eduradiusllc/boss-ai-web/HauESU7n7XSsusnzRLxea5kHirWM
```

Deployment ID:

```text
dpl_HauESU7n7XSsusnzRLxea5kHirWM
```

## Changes

Added:

```text
apps/web/src/components/ui/ProductGallery.tsx
```

Updated:

```text
apps/web/app/page.tsx
apps/web/app/landing.css
apps/web/src/components/ui/MarketingNav.tsx
```

Removed duplicate static pages:

```text
apps/web/public/landing.html
apps/web/public/landing-v2.html
```

## Validation Gates

```text
pnpm lint       PASS
pnpm typecheck  PASS
pnpm test       PASS
pnpm build      PASS
```

## Deployment Evidence

```text
Downloading 2739 deployment files...
Detected Next.js version: 15.5.19
apps/web build: ✓ Compiled successfully
Build Completed in /vercel/output [1m]
Deployment completed
status ● Ready
```

## Notes

The build used the existing `boss-ai-web` project with Root Directory `apps/web`, deployed from repository root.
