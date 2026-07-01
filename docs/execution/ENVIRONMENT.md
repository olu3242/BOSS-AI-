# Environment Configuration

BOSS currently supports two runtime modes:

| Mode | Entry point | Required variables | Notes |
|------|-------------|--------------------|-------|
| In-memory | `createInMemoryApi()` | none | Used by tests, demos, and local command-center workflows. Data is ephemeral. |
| Postgres | `createApi()` | `DATABASE_URL` recommended | Falls back to `postgresql://postgres:postgres@localhost:5432/boss_dev` for local development. |

Production identity uses Supabase:

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Supabase project API URL |
| `SUPABASE_ANON_KEY` | Yes | Sign-up, sign-in, refresh, verification, and reset |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Server-side session revocation during logout |
| `BOSS_AUTH_CALLBACK_URL` | Yes | Public callback URL, for example `https://app.example.com/auth/callback` |
| `BOSS_PASSWORD_RESET_URL` | Recommended | Password recovery callback; defaults to `/auth/callback` on the current origin in development |

Browser identity also requires `DATABASE_URL` and migration
`0021_identity_organizations.sql`. The callback URL must be present in the
Supabase project's redirect allowlist. Session tokens are stored in HTTP-only,
`SameSite=Lax` cookies; production cookies are also `Secure`.

Production runtime persistence requires migrations through
`0021_identity_organizations.sql`. Runtime database work must execute with a
verified tenant context:

```sql
SET LOCAL app.current_org_id = '<organization-uuid>';
```

The API must still include explicit `org_id` predicates because privileged
server roles may bypass RLS. Each worker process must use a unique worker ID
and instance ID; reusing identities across live processes invalidates lease
ownership guarantees.

Identity repository calls always include the authenticated user ID. Production
database roles must either set `app.current_user_id` for direct RLS access or
use the server repository with an explicitly scoped service role.

`createHealthCheck("postgres")` reports `degraded` when `DATABASE_URL` is
missing. `createHealthCheck("in_memory")` reports `ok` without external
services.

## Local validation

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm arch:check
```

## Demo command center

```bash
BOSS_WEB_DEMO=1 pnpm --filter @boss/web dev
```

The demo runs the complete in-memory business intelligence flow and prints
the generated command-center summary. The full HTML renderer is exported
from `@boss/web` as `renderCommandCenterHtml()`.

## Development servers

| Service | Command | URL |
|---------|---------|-----|
| Web | `pnpm --filter @boss/web dev` | `http://127.0.0.1:3000` |
| API | `pnpm --filter @boss/api dev` | `http://127.0.0.1:4000/health` |
| Combined | `pnpm dev` | Starts API and Web together through `scripts/dev.ps1`. |

## Certification utilities

The API package exports:

- `assertPlatformAccess()` for tenant-scoped role/action checks
- `createAuditEvent()` and `InMemoryAuditSink` for audit trail testing
- `createTraceId()`, `createStructuredLog()`, and `measureOperation()` for
  traceable diagnostics
- `createHealthCheck()` and `validateEnvironment()` for runtime readiness
  checks
- `createExecutionRuntimeHealth()` for queue, dead-letter, agent, workflow, and
  lifecycle diagnostics
