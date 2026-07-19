# Root Directory Validation

Date: 2026-07-08

## Result

Status: PASS.

Vercel can recognize `apps/web` when the deployment source is the repository root.

## Required Configuration

```text
Project:         boss-ai-web
Root Directory: apps/web
Framework:      Next.js
```

## Invalid Deployment Pattern

Do not trigger CLI deployments from:

```text
C:\Cdev\BOSS AI\BOSS-AI\apps\web
```

when the Vercel project Root Directory is:

```text
apps/web
```

That combination causes Vercel to receive `apps/web` as the source root, then search for a nested `apps/web` path that does not exist.

Failure evidence:

```text
Downloading 149 deployment files...
The specified Root Directory "apps/web" does not exist.
```

## Valid Deployment Pattern

Trigger CLI deployments from:

```text
C:\Cdev\BOSS AI\BOSS-AI
```

with the Vercel project linked to:

```text
boss-ai-web
```

Success evidence:

```text
Downloading 2721 deployment files...
Detected Next.js version: 15.5.19
Build Completed in /vercel/output
Deployment completed
status ● Ready
```

## Validation Deployment

Preview URL:

```text
https://boss-ai-mktktx22w-eduradiusllc.vercel.app
```

Inspector:

```text
https://vercel.com/eduradiusllc/boss-ai-web/6exJwMk3S3bJ2f1MXy7cq6SBxPdD
```

## Conclusion

The Root Directory `apps/web` is valid.

The previous failure was caused by deployment source mismatch, not by a missing GitHub directory.
