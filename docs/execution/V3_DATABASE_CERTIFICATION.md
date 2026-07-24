# BOSS V3 — Database Certification

**Date:** 2026-07-24  
**Status:** CONDITIONAL PASS

---

## Migration History

| Range | Status |
|---|---|
| 0001–0046 | ✅ Applied |
| 0047 (custom access token hook) | ⏳ Requires manual apply in Supabase SQL Editor |

---

## Schema Conventions Compliance

| Convention | Status |
|---|---|
| `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` | ✅ All tables |
| `created_at timestamptz NOT NULL DEFAULT now()` | ✅ All tables |
| `updated_at timestamptz NOT NULL DEFAULT now()` | ✅ All tables |
| `org_id uuid NOT NULL REFERENCES organizations(id)` | ✅ All tenant tables |
| Soft deletes (`deleted_at`) | ✅ businesses, workflows, agents |
| Audit log triggers | ✅ Mutation tables |

---

## Row-Level Security

| Table | RLS Enabled | Policy | Status |
|---|---|---|---|
| `organizations` | ✅ | owner only | ✅ |
| `businesses` | ✅ | org_id match | ✅ |
| `business_profiles` | ✅ | org_id via join | ✅ |
| `workflows` | ✅ | org_id match | ✅ |
| `workflow_instances` | ✅ | org_id match | ✅ |
| `ai_agents` | ✅ | org_id match | ✅ |
| `mri_reports` | ✅ | org_id match | ✅ |
| `event_journal` | ✅ | org_id match | ✅ |
| `platform_super_admins` | ✅ | service role only | ✅ |

**Note:** Policy correctness (no missing org_id filter, no policy bypass) requires a full RLS audit — listed as open item in security report.

---

## Key Tables

### `organizations`
- `id`, `name`, `slug`, `plan`, `owner_user_id`
- `created_at`, `updated_at`
- No `org_id` (this IS the org)

### `businesses`
- `id`, `org_id`, `name`, `industry`, `status`
- `profile` (jsonb), `health_score`, `last_mri_at`
- Soft delete: `deleted_at`

### `mri_reports`
- `id`, `org_id`, `business_id`, `status`
- `result` (jsonb), `started_at`, `completed_at`, `error`

### `event_journal`
- `id`, `org_id`, `stream_id`, `event_type`, `payload` (jsonb)
- `created_at` — append-only, no updates/deletes

### `workflow_instances`
- `id`, `org_id`, `workflow_id`, `business_id`
- `state` (jsonb), `status`, `started_at`, `completed_at`

---

## Migration 0047 — Custom Access Token Hook

```sql
-- Creates the hook function that stamps org_id, role, is_super_admin
-- into every JWT issued by Supabase Auth
CREATE OR REPLACE FUNCTION public.boss_custom_access_token_hook(event jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
...
$$;

GRANT EXECUTE ON FUNCTION public.boss_custom_access_token_hook TO supabase_auth_admin;
```

**Manual step required:**
1. Apply function in Supabase SQL Editor
2. Register hook: Supabase Dashboard → Auth → Hooks → Custom Access Token Hook → `public.boss_custom_access_token_hook`

Without this hook, `org_id` is absent from JWTs and all `requireOrgId` calls fall through the `missing_tenant_context` fallback path.

---

## Connection Configuration

| Setting | Value | Status |
|---|---|---|
| Connection type | Supabase pooler (pgBouncer) | ✅ |
| Region | AWS us-west-2 | ✅ |
| Max connections | Pooler-managed | ✅ |
| SSL | Required (Supabase default) | ✅ |

---

## Open Items

- [ ] **Full RLS audit** — verify every table with tenant data enforces `org_id` isolation at the DB level, not just at the application layer
- [ ] **Apply migration 0047** in Supabase SQL Editor
- [ ] **Register custom access token hook** in Supabase Dashboard

---

## Certification Decision

**CONDITIONAL PASS.** Schema conventions are correctly applied across all tables. RLS policies exist on all tenant tables. Migration 0047 is implemented but requires manual application. Full PASS pending:

1. Migration 0047 applied
2. Custom access token hook registered
3. Full RLS audit completed
