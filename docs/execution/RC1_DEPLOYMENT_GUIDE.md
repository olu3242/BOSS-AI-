# RC1 Deployment Guide

**Date:** 2026-06-30

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm 9+

---

## Build

```bash
pnpm install
pnpm -r build
```

---

## Database Setup

Run migrations in order:

```bash
# Using psql
for f in packages/db/migrations/*.sql; do
  psql $DATABASE_URL -f "$f"
done
```

Migrations are idempotent (`CREATE TABLE IF NOT EXISTS`).

---

## Environment Configuration

```bash
# Required
export DATABASE_URL="postgresql://user:pass@host:5432/boss"
export SUPABASE_JWT_SECRET="<supabase-project-jwt-secret>"
export SECRET_VAULT_KEY="$(openssl rand -hex 32)"
export NODE_ENV="production"

# Optional
export ANTHROPIC_API_KEY="<anthropic-key>"  # enables Claude features
export PORT="3000"
```

---

## Start

```bash
node apps/api/dist/server.js
```

---

## Supabase Auth Setup (TD-030)

To enable real user authentication, create a Supabase custom access-token hook that stamps `org_id` and `role` on every issued JWT:

```typescript
// supabase/functions/custom-access-token/index.ts
Deno.serve(async (req) => {
  const { user_id } = await req.json();
  // Look up user's org membership and role
  const { org_id, role } = await getOrgMembership(user_id);
  return Response.json({
    additional_claims: { org_id, role }
  });
});
```

Deploy this function and configure it in the Supabase Dashboard under Authentication → Hooks.

---

## Scheduler Worker

Add a cron job to invoke `runDue` every minute:

```sql
-- pg_cron (if available)
SELECT cron.schedule('boss-scheduler', '* * * * *',
  $$SELECT net.http_post(
    url := 'http://localhost:3000/api/v1/scheduler/run-due',
    headers := '{"Authorization": "Bearer <service-token>"}'::jsonb
  )$$
);
```

Alternatively, use an external Lambda or Render cron job.

---

## Verifying the Deployment

```bash
# Health check
curl http://localhost:3000/health

# Mint a dev token (non-production only)
curl -X POST http://localhost:3000/api/v1/auth/dev-token \
  -H "Content-Type: application/json" \
  -d '{"orgId": "your-org-id"}'

# Use the token
curl http://localhost:3000/api/v1/businesses \
  -H "Authorization: Bearer <token>"
```
