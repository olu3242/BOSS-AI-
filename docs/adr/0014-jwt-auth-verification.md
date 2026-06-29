# ADR-0014: Verified JWT auth replaces the spoofable `x-org-id` header

**Status:** accepted
**Date:** 2026-06-29

## Context

Goals 13-14 built a working HTTP API and web app, but both trusted tenancy
on the honor system: `apps/api/src/http/server.ts` read org_id from a raw
`x-org-id` header (TD-027 — "trivially spoofable"), and `apps/web` sent a
hardcoded `DEMO_ORG_ID` (TD-006). CLAUDE.md's API conventions call for
"Bearer token (Supabase JWT)" and "org_id extracted from JWT, never from
request body." Goal 15 (production hardening) starts by closing this gap,
since every other hardening item (real provider adapters, secrets, real
scheduling) is lower-risk than an unauthenticated multi-tenant API.

There is still no real login UI, no `organizations`/`users` schema, and no
Supabase Auth project wired up — building all of that is a much larger
identity-context feature. This ADR scopes the smallest change that
replaces "the server trusts whatever header the caller sends" with "the
server only trusts a cryptographically signed token," without pretending
the login/signup problem is solved.

## Decisions

1. **`apps/api/src/http/auth.ts`** — `requireOrgId(req)` is now async: it
   reads `Authorization: Bearer <token>`, verifies it as an HS256 JWT
   against `SUPABASE_JWT_SECRET` using `jose`, and extracts a custom
   `org_id` claim from the verified payload. Missing/invalid token → 401;
   valid token with no `org_id` claim → 403. All ~30 existing call sites
   in `server.ts` were changed from `requireOrgId(req)` to
   `await requireOrgId(req)` — no other route logic changed.
2. **`org_id` as a custom JWT claim**, not a DB lookup per request. Real
   Supabase Auth supports stamping custom claims via an access-token hook
   at sign-in; this assumes that hook exists rather than building an
   `organizations`/`org_members` schema and a per-request membership
   query in this pass. That schema is real follow-up work, not something
   this ADR pretends to close.
3. **`mintDevToken(orgId)`**, exposed only via `POST /api/v1/auth/dev-token`
   and only when `NODE_ENV !== "production"`. Since no login UI exists,
   this is how `apps/web` and tests obtain a validly-signed token: it
   signs the same way a real Supabase access-token hook would, so the
   verification path is exercised for real, while issuance is an
   explicit, narrowly-scoped placeholder (TD-030).
4. **`SUPABASE_JWT_SECRET` is required in production** (`server.ts`
   throws if unset) and defaults to an obviously-fake value in
   non-production so `next dev`/tests/CI keep working without manual
   setup.
5. **`apps/web/src/lib/apiClient.ts`** now exchanges `DEMO_ORG_ID` for a
   dev token via `/auth/dev-token` before every request, sending
   `Authorization: Bearer <token>` instead of `x-org-id`. `DEMO_ORG_ID`
   itself is unchanged — it's still standing in for a real session, just
   one layer further back.

## Consequences

- TD-027 (spoofable header) is resolved: a caller can no longer claim an
  arbitrary org_id by setting a header; they need a token whose signature
  verifies against the server's secret.
- TD-006 is narrowed, not closed: there is still no real login, no
  `organizations`/`users` schema, and no Supabase project. New TD-030
  tracks exactly that remaining gap (the dev-token route and its
  "anyone can mint a token for any org_id" trust model).
- Every route handler in `server.ts` is now `async` at the org_id
  extraction step; this only changed `requireOrgId(req)` →
  `await requireOrgId(req)`, no handler signatures changed since they
  were already `async (req) => ...`.
- `apps/web` now makes one extra round trip (token fetch) before every
  API call; acceptable for a dev placeholder, worth revisiting (token
  caching) once real sessions exist.

## Alternatives considered

- Building a real `organizations`/`org_members` schema and Supabase Auth
  integration in this pass. Rejected for scope: that's a full identity
  bounded-context feature (signup, login UI, session handling in
  `apps/web`), and CLAUDE.md's own goal sequencing principle (validate
  one integration point at a time) argues for closing the verification
  gap first and tracking issuance as separate, explicit debt.
- A symmetric API key instead of a JWT. Rejected: CLAUDE.md's API
  conventions explicitly specify Supabase JWT bearer tokens, and a JWT
  carries the org_id claim Supabase Auth's hook mechanism is designed to
  stamp, where a bare API key would need its own lookup table anyway.
