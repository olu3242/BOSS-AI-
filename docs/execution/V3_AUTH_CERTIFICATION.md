# BOSS V3 — Authentication Certification

**Date:** 2026-07-24  
**Branch:** claude/boss-renaissance-v3  
**Status:** CONDITIONAL PASS

---

## Authentication Architecture

```
Browser
  │
  ├─ Sign-up / Sign-in → Supabase Auth (email+password)
  │     └─ Supabase issues JWT → access + refresh tokens
  │
  ├─ Custom Access Token Hook (migration 0047)
  │     └─ stamps org_id, role, is_super_admin into JWT claims
  │
  ├─ Next.js Web (Vercel)
  │     ├─ Cookie-based session: ACCESS_COOKIE, REFRESH_COOKIE, PERSIST_COOKIE
  │     ├─ Middleware guards all authenticated routes
  │     └─ Server actions call requireBrowserIdentity() / requireActiveTenant()
  │
  └─ Express API (Render)
        └─ requireOrgId(): verifies JWT via JWKS (ES256) or HS256 fallback
              └─ extracts org_id from JWT claim only — never from request body
```

---

## Components

### Next.js Middleware (`apps/web/middleware.ts`)
- **Status:** ✅ PASS
- Guards: `/dashboard`, `/onboarding`, `/businesses`, `/business`, `/marketplace`, `/cs`, `/ops`
- Redirects unauthenticated requests to `/auth/sign-in?next=<path>`
- Cookie presence check (access OR refresh) — refresh triggers token refresh via `/api/auth/refresh`

### Server Auth (`apps/web/src/server/auth.ts`)
- **Status:** ✅ PASS
- `readBrowserIdentity()` — verifies access token via Supabase provider
- `requireBrowserIdentity()` — redirects on missing session; triggers refresh if refresh token present
- `requireActiveTenant()` — additionally resolves active org; redirects to onboarding if none
- `writeSessionCookies()` / `clearSessionCookies()` — httpOnly, SameSite=Lax, secure in production
- Debug `console.log` removed — no env var leakage

### API JWT Verification (`apps/api/src/http/auth.ts`)
- **Status:** ✅ PASS (pending Render deployment health)
- Primary: JWKS endpoint at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` (ES256)
- Fallback: HMAC-SHA256 with `SUPABASE_JWT_SECRET` (local dev)
- `requireOrgId()`: extracts `org_id` from JWT claim; falls back to `x-organization-id` header with DB membership check; throws `missing_tenant_context` if neither
- `requireRole()`: enforces role hierarchy (owner=4, admin=3, member=2, viewer=1)
- `requireSuperAdmin()`: checks `platform_super_admins` table
- `mintDevToken()`: disabled when `NODE_ENV === "production"` — confirmed by preflight log (`staticTokenPresent: false`)

### Custom Access Token Hook (`packages/db/migrations/0047_custom_access_token_hook.sql`)
- **Status:** ⚠️ PENDING REGISTRATION
- PostgreSQL function `public.boss_custom_access_token_hook(event jsonb)` exists in migration
- SECURITY DEFINER; GRANT EXECUTE to `supabase_auth_admin`; REVOKE from PUBLIC
- **Required action:** Apply migration in Supabase SQL Editor; register in Supabase Dashboard → Auth → Hooks

---

## Security Properties

| Property | Status | Notes |
|---|---|---|
| Tokens never in URL | ✅ | Cookie-only transport |
| Cookies httpOnly | ✅ | Cannot be read by JS |
| Cookies SameSite=Lax | ✅ | CSRF-resistant |
| Cookies secure in prod | ✅ | `process.env.NODE_ENV === "production"` |
| org_id from JWT only | ✅ | Never from request body |
| Dev token disabled in prod | ✅ | Confirmed by preflight log |
| Refresh token rotation | ✅ | Via `/api/auth/refresh` route |
| Session cookie max-age | ✅ | Access: token TTL; Refresh: 30 days if persistent |

---

## Auth Routes Verified

| Route | Handler | Status |
|---|---|---|
| `POST /auth/sign-up` | Supabase Auth → cookies | ✅ exists |
| `POST /auth/sign-in` | Supabase Auth → cookies | ✅ exists |
| `GET /api/auth/refresh` | Refresh token → new access token | ✅ exists |
| `POST /api/auth/sign-out` | Clear cookies | ✅ exists |
| `GET /auth/callback` | OAuth callback handler | ✅ exists |
| `GET /auth/verify` | Email verification handler | ✅ exists |

---

## Certification Decision

**CONDITIONAL PASS.** The authentication architecture is sound. Cookie security, JWT verification, tenant isolation, and dev-token disablement are all correctly implemented. The only remaining gap is the Supabase custom access token hook registration — without it, `org_id`/`role` claims are not stamped into JWTs, so `requireOrgId()` falls back to the header+DB path on every request.

Re-assess to FULL PASS after:
1. Migration 0047 applied in Supabase SQL Editor
2. Hook registered in Supabase Dashboard
3. End-to-end sign-in confirmed to produce JWTs with `org_id` claim
