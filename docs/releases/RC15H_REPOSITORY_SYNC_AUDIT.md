# RC15H Repository Sync Audit

Date: 2026-07-08

## Result

Status: PASS for repository/root synchronization. NOT CERTIFIED for full runtime validation.

The root cause of Vercel reporting:

```text
The specified Root Directory "apps/web" does not exist.
```

was not that GitHub lacked `apps/web`. GitHub `main` contains `apps/web`. The failure was caused by triggering a CLI deployment from `apps/web` while the Vercel project Root Directory was also set to `apps/web`. That uploaded the web folder as the deployment source, so Vercel then looked for `apps/web` inside that already-nested source and failed.

## Local Repository Certification

Repository:

```text
C:\Cdev\BOSS AI\BOSS-AI
```

Current branch:

```text
main
```

Remote:

```text
origin  https://github.com/olu3242/BOSS-AI- (fetch)
origin  https://github.com/olu3242/BOSS-AI- (push)
```

Local HEAD:

```text
9620f0cf5a36b96f11140695aacb99c7b2cdc19e
```

Recent history:

```text
9620f0c feat(api): switch JWT verification to Supabase JWKS endpoint (ES256)
a202130 chore: add Railway deployment config and Procfile for API server
0662c6b chore: set metadataBase to production Vercel URL
a0ab948 chore: add Vercel deployment config for monorepo web app
bb6c067 Merge pull request #7 from olu3242/claude/boss-repo-normalization-n1jdx5
```

Tags:

```text
v0.4.0-platform-foundation
```

Working tree:

```text
DIRTY
```

The dirty tree contains deployment report/config artifacts from RC15D-RC15H work. No application business logic was modified during RC15H.

## Repository Structure Certification

Local filesystem contains:

```text
apps/
  api/
  web/
```

`apps/web` contains the expected deployable Next.js app files:

```text
app/
src/
package.json
next.config.mjs
vercel.json
```

The committed local tree also contains:

```text
apps/web
apps/api
```

## GitHub Certification

GitHub repository:

```text
https://github.com/olu3242/BOSS-AI-
```

Default branch:

```text
main
```

GitHub `main` HEAD:

```text
9620f0cf5a36b96f11140695aacb99c7b2cdc19e
```

This matches local `HEAD`.

GitHub tree evidence confirms:

```text
apps/web
apps/web/app
apps/web/src
apps/web/package.json
apps/web/next.config.mjs
apps/web/vercel.json
```

## Vercel Project Certification

Project:

```text
eduradiusllc/boss-ai-web
```

Project ID:

```text
prj_QVRc6hx6T2xgXl2DzfuKt0NIW9QY
```

Current project settings:

```text
Root Directory      apps/web
Framework Preset    Next.js
Node.js Version     24.x
Build Command       cd ../.. && pnpm --filter @boss/web... build
Output Directory    .next
Install Command     cd ../.. && pnpm install --frozen-lockfile
```

Local Vercel linkage now points both repository root and `apps/web` to `boss-ai-web`:

```json
{"projectId":"prj_QVRc6hx6T2xgXl2DzfuKt0NIW9QY","orgId":"team_zNHlJbJHa4YZFwN4p9lcHzEH","projectName":"boss-ai-web"}
```

## Failed Deployment Evidence

Deployment:

```text
https://boss-ai-2s9atsjis-eduradiusllc.vercel.app
```

Failure:

```text
Downloading 149 deployment files...
The specified Root Directory "apps/web" does not exist. Please update your Project Settings.
```

Diagnosis:

The deployment source was too small and did not include the repository root. Because it was triggered from `apps/web`, Vercel received a source tree where `apps/web` was not present as a child path.

## Remediation Applied

The repository root was linked to the existing Vercel project:

```text
vercel link --yes --project boss-ai-web
```

No duplicate Vercel project was created.

Then a fresh Preview deployment was triggered from repository root:

```text
vercel deploy --yes --target preview
```

## Successful Preview Deployment Evidence

Deployment:

```text
https://boss-ai-mktktx22w-eduradiusllc.vercel.app
```

Inspector:

```text
https://vercel.com/eduradiusllc/boss-ai-web/6exJwMk3S3bJ2f1MXy7cq6SBxPdD
```

Deployment status:

```text
READY
```

Build evidence:

```text
Downloading 2721 deployment files...
Detected Next.js version: 15.5.19
Running "cd ../.. && pnpm --filter @boss/web... build"
apps/web build: ✓ Compiled successfully
Build Completed in /vercel/output
Deployment completed
status ● Ready
```

## Remaining Non-Sync Blockers

Preview environment variables remain empty:

```text
No Environment Variables found for eduradiusllc/boss-ai-web
```

The Preview URL is also protected by Vercel access control. HTTP checks returned Vercel's login page:

```text
/              200 Login - Vercel
/auth/sign-in  200 Login - Vercel
/auth/sign-up  200 Login - Vercel
/waitlist      200 Login - Vercel
```

These are RC15H follow-on runtime/access blockers, not repository synchronization blockers.

## Conclusion

Git, GitHub, and Vercel are now aligned enough for Vercel to recognize and build `apps/web`.

The exact mismatch was deployment source location:

```text
CLI deploy from apps/web + Vercel Root Directory apps/web = Vercel searches for apps/web inside apps/web upload
```

Correct deployment source:

```text
Repository root
```

Correct project Root Directory:

```text
apps/web
```
