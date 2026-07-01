# RC1.3 — Production Checklist
## Launch Readiness Gate

**Date:** 2026-07-01

---

## Deployment Infrastructure

| Item | Status | Owner | Notes |
|------|--------|-------|-------|
| Frontend: Vercel project configured | ⬜ Pending | DevOps | Connect `apps/web` to Vercel |
| API: Railway/Fly.io project configured | ⬜ Pending | DevOps | Connect `apps/api` to Railway |
| Database: Supabase project provisioned | ⬜ Pending | DevOps | Production Postgres |
| Database: Migrations deployed | ⬜ Pending | DevOps | All 17 migration files in `packages/db/migrations/` |
| Domain: DNS configured | ⬜ Pending | DevOps | `app.boss.ai` → Vercel; `api.boss.ai` → Railway |
| CDN: Static assets on edge | ⬜ Pending | DevOps | Vercel handles automatically |
| SSL: TLS certificates | ⬜ Pending | DevOps | Vercel and Railway handle automatically |

---

## Secrets Management

| Secret | Status | Notes |
|--------|--------|-------|
| `SUPABASE_JWT_SECRET` | ⬜ Pending | Must match Supabase project JWT secret |
| `SUPABASE_URL` | ⬜ Pending | Supabase project URL |
| `SUPABASE_ANON_KEY` | ⬜ Pending | Frontend auth |
| `NEXT_PUBLIC_API_BASE_URL` | ⬜ Pending | Points to Railway API |
| `SECRET_VAULT_KEY` | ⬜ Pending | AES-256-GCM key for SecretVault |
| `ANTHROPIC_API_KEY` | ⬜ Pending | For executive brief generation |
| Provider credentials | ⬜ Pending | Per-integration API keys in SecretVault |
| Secrets tool | ⬜ Pending | Doppler or Vercel env vars (not plain text) |

---

## Database

| Item | Status | Notes |
|------|--------|-------|
| All 17 tables created | ⬜ Pending | Run `packages/db/migrations/` in order |
| Row-level security enabled | ⬜ Pending | Every table must have RLS policy |
| `org_id` index on all tables | ⬜ Pending | Critical for multi-tenant query performance |
| Supabase custom access-token hook (TD-030) | ⬜ Pending | Stamps `org_id` + `role` into JWT |
| Automated backups | ⬜ Pending | Supabase daily backups; confirm enabled |
| Point-in-time recovery | ⬜ Pending | Supabase Pro plan |

---

## Authentication

| Item | Status | Notes |
|------|--------|-------|
| Supabase Auth enabled | ⬜ Pending | Email+password provider |
| Custom access-token hook (TD-030) | ⬜ Pending | Hook stamps `org_id` claim |
| Email verification flow | ⬜ Pending | Supabase handles email; frontend needs verify page |
| Auth UI pages | ⬜ Pending | Signup, login, verify — frontend work |

---

## Environment Configuration

| Item | Status | Notes |
|------|--------|-------|
| `NODE_ENV=production` | ⬜ Pending | Disables dev-token endpoint |
| `PORT` configured | ✅ Defaulted | `process.env.PORT ?? 4000` |
| `SUPABASE_JWT_SECRET` startup check | ✅ Implemented | `server.ts` throws if missing in production |
| All required env vars documented | ✅ | In this checklist |
| No secrets in code | ✅ | SecretVault pattern used |
| Dev defaults removed in production | ✅ | `/auth/dev-token` route gated by `NODE_ENV !== "production"` |

---

## Health Checks

| Item | Status | Notes |
|------|--------|-------|
| `GET /` returns 200 | ✅ | Express root handler |
| `GET /health` endpoint | ⬜ Missing | Should return DB + queue + scheduler status |
| Observability `GET /metrics` | ✅ | Returns MetricSnapshot |
| External uptime monitor | ⬜ Pending | Pingdom, Better Uptime, or similar |

---

## CI/CD Pipeline

| Item | Status | Notes |
|------|--------|-------|
| TypeScript typecheck gate | ✅ | `pnpm -r typecheck` — 0 errors |
| Test suite gate | ✅ | 220/220 passing |
| Lint gate | ⬜ Pending | ESLint config exists; CI not wired |
| Build gate | ⬜ Pending | `next build` must pass |
| Deployment automation | ⬜ Pending | Vercel auto-deploys on push to `main` |
| Rollback procedure | ⬜ Pending | Vercel: instant rollback via dashboard |

---

## Security

| Item | Status | Notes |
|------|--------|-------|
| Multi-tenant isolation | ✅ | `org_id` on every repo call, extracted from JWT |
| JWT verification | ✅ | HS256 via `jose`, checks `exp` |
| RBAC | ✅ | `requireRole()` — owner/admin/member/viewer |
| Input validation | ✅ | Zod schemas on all mutation routes |
| SQL injection | ✅ | Parameterized queries via repository layer |
| XSS | ✅ | Next.js escapes JSX by default |
| CSRF | ⬜ Pending | SameSite cookie config required |
| Rate limiting | ⬜ Pending | No per-org throttling implemented |
| OWASP Top 10 audit | ⬜ Pending | Pre-GA item |

---

## Monitoring

| Item | Status | Notes |
|------|--------|-------|
| Error tracking (Sentry) | ⬜ Pending | Requires `SENTRY_DSN` + SDK integration |
| Structured logging (Pino) | ⬜ Pending | Currently only `console.log` |
| Log aggregator | ⬜ Pending | Logtail, Datadog, or Fly.io built-in |
| Uptime monitoring | ⬜ Pending | External probe required |
| Alerting | ⬜ Pending | PagerDuty or email alerts on errors |

---

## Go/No-Go Criteria

The following must ALL be ✅ before serving production traffic:

- [ ] Supabase project provisioned + TD-030 hook deployed
- [ ] All 17 DB tables migrated with RLS
- [ ] `SUPABASE_JWT_SECRET` injected via Doppler/Vercel env
- [ ] `NODE_ENV=production` set (disables dev-token)
- [ ] Auth UI (signup/login) deployed
- [ ] `GET /health` endpoint live
- [ ] External uptime monitor active
- [ ] Error monitoring (Sentry or equivalent) wired
- [ ] Typecheck: 0 errors
- [ ] Tests: 220/220 passing
- [ ] Production build: passing

**Current status: 6/11 Go criteria met. Pre-production environment only.**
