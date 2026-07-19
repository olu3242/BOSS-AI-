# Staging Validation

Date: 2026-07-08

## Summary

Status: BLOCKED

Staging validation could not proceed beyond Vercel build setup. No READY preview deployment exists from this run.

## Validation Matrix

| Area | Result | Notes |
| --- | --- | --- |
| Preview deployment | FAIL | Build setup fails before app build/runtime |
| Homepage HTTP 200 | NOT RUN | No READY deployment |
| Health endpoint | NOT RUN | No READY deployment |
| Runtime logs | LIMITED | Build logs available; runtime logs unavailable because deployments never reached READY |
| API startup | NOT RUN | No runtime |
| Database connectivity | NOT RUN | No runtime |
| Supabase connectivity | NOT RUN | No runtime |
| Dashboard | NOT RUN | No runtime |
| Settings | NOT RUN | No runtime |
| MRI | NOT RUN | No runtime |
| KPIs | NOT RUN | No runtime |
| Executive Workspace | NOT RUN | No runtime |

## Environment Variable Audit

Vercel variables observed by name only:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `VERCEL_URL`
- `CRON_SECRET`

Repository-required or referenced variables not observed in the Vercel listing:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `BOSS_AUTH_CALLBACK_URL`
- `BOSS_PASSWORD_RESET_URL`
- `BOSS_API_PORT`
- `HOST`
- `PORT`
- `BOSS_FLAG_AI_WORKFORCE`
- `BOSS_WEB_DEMO`
- `SERVICETITAN_APP_KEY`
- `QB_SANDBOX`

Potential risk: `NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:4000` in web code. If it is missing in Preview/Production, server-side API proxy routes and ops/customer-success pages can point at localhost in the deployed environment.

## Required Follow-Up

After correcting Vercel root/framework settings, re-audit environment variables for Preview and Production before promoting.
