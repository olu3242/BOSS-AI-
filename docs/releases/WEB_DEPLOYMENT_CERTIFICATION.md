# Web Deployment Certification

Date: 2026-07-08

## Certification Status

Status: NOT CERTIFIED.

RC15G successfully identified and provisioned the intended web project name, but the live web deployment remains blocked by infrastructure configuration.

## Certification Checklist

| Gate | Status | Evidence |
| --- | --- | --- |
| `boss-ai-web` project exists | PASS | Vercel project inspect found `eduradiusllc/boss-ai-web` |
| Project linked locally | PASS | `apps/web/.vercel/project.json` references `boss-ai-web` |
| Framework is Next.js | PASS | Vercel reports `Framework Preset Next.js` |
| Root Directory is `apps/web` | FAIL | Vercel reports `Root Directory .` |
| Preview env vars configured | FAIL | Vercel reports no Preview env vars |
| Preview deployment succeeds | FAIL | Vercel build status is Error |
| Homepage HTTP 200 | BLOCKED | No successful Preview deployment |
| Login page loads | BLOCKED | No successful Preview deployment |
| Signup page loads | BLOCKED | No successful Preview deployment |
| Runtime initializes | BLOCKED | Build failed before runtime |
| No `FUNCTION_INVOCATION_FAILED` | BLOCKED | Runtime not reached |

## Verified Repository State

The repository remains a pnpm monorepo with the web app at:

```text
apps/web
```

`apps/web/package.json` declares:

```json
"next": "^15.5.19"
```

Therefore the Vercel error `No Next.js version detected` is not caused by the source package lacking Next.js. The supporting evidence points to Vercel project/root provisioning.

## Runtime Variables Required Before Certification

The following Preview values must be configured before runtime validation can proceed:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_API_BASE_URL
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
BOSS_AUTH_CALLBACK_URL
BOSS_PASSWORD_RESET_URL
DATABASE_URL
SUPABASE_JWT_SECRET or equivalent Supabase JWT/JWKS configuration
```

Additional optional/provider variables should be configured only when their live flows are included in the certification pass:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
ANTHROPIC_API_KEY
CRON_SECRET
NEXT_PUBLIC_STATIC_TOKEN
BOSS_WEB_DEMO
```

## Validation Not Completed

The following could not be validated because the Preview deployment failed during build:

- Homepage load
- Login route
- Signup route
- Marketing pages
- Static assets
- Middleware startup
- Server actions
- Client bundle loading
- Runtime logs
- Health endpoint

## Certification Decision

The web deployment is NOT CERTIFIED.

Required next action: correct `boss-ai-web` project Root Directory to `apps/web`, populate Preview env vars, and redeploy.

## Regression Evidence

The local repository gates remain green:

```text
pnpm lint       PASS
pnpm typecheck  PASS
pnpm test       PASS
pnpm build      PASS
```

No business logic was changed during RC15G.
