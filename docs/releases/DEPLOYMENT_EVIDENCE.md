# Deployment Evidence

Date: 2026-07-08

## Commands And Evidence

### Vercel Project Inspect

Command:

```text
vercel project inspect boss-ai
```

Evidence:

```text
Project: eduradiusllc/boss-ai
Root Directory: apps
Framework Preset: Node
Build Command: cd ../.. && pnpm --filter @boss/web... build
Output Directory: .next
Install Command: cd ../.. && pnpm install --frozen-lockfile
Node.js Version: 24.x
```

### Repository Root Deploy

Command:

```text
vercel deploy --yes
```

Evidence:

```text
The vercel.json file should be inside of the provided root directory.
Error: Invalid vercel.json - should NOT have additional property `projects`.
```

### App Path Deploy

Command:

```text
vercel deploy apps/web --yes --local-config apps/web/vercel.json
```

Preview URL:

```text
https://boss-486hvjp4d-eduradiusllc.vercel.app
```

Evidence:

```text
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
ERR_PNPM_NO_PKG_MANIFEST No package.json found in /vercel
Error: Command "cd ../.. && pnpm install --frozen-lockfile" exited with 1
```

### Local Vercel Build

Command:

```text
vercel build --yes --local-config vercel.json
```

Run from:

```text
apps/web
```

Evidence:

```text
Running "install" command: `cd ../.. && pnpm install --frozen-lockfile`...
No package.json found in C:\Cdev\BOSS AI
```

### Pulled Project Settings

File:

```text
apps/.vercel/project.json
```

Evidence:

```json
{
  "settings": {
    "framework": "node",
    "installCommand": "cd ../.. && pnpm install --frozen-lockfile",
    "buildCommand": "cd ../.. && pnpm --filter @boss/web... build",
    "outputDirectory": " .next",
    "rootDirectory": "apps",
    "nodeVersion": "24.x"
  }
}
```

## Conclusion

The same incorrect root appears in remote inspection, pulled local Vercel settings, remote build behavior, and local Vercel build behavior.

This is a verified external project-configuration blocker.
