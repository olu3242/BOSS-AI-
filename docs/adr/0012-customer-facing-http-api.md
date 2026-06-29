# ADR-0012: Customer-facing HTTP API as a thin Express transport over existing controllers

**Status:** accepted
**Date:** 2026-06-29

## Context

Through Goal 12, `apps/api` had typed services and logic-free controllers for
every bounded context (Business Profile, MRI, DNA, Health, Capabilities,
Timeline, Constraints, Recommendations, Tool Fabric, Mission Control), but
`createApi()` only returned a plain object of functions — there was no way
to reach the platform over the network (TD-002). Goal 13 closes that gap.

## Decisions

1. **Express, mounted as a single thin transport layer
   (`apps/api/src/http/server.ts`)**, not a rewrite of any controller.
   `createHttpServer(api)` takes the object `createApi()`/
   `createApiFromContainer()` already returns and maps each controller
   method onto one REST route under `/api/v1`, following CLAUDE.md's
   `/api/v1/{context}/{resource}` convention. Every route handler is a
   one-line pass-through (`wrap(async (req) => api.X.method(...))`) — no
   business logic, no validation logic, no new decision-making lives in
   this file.
2. **`createApi()` was split into `createApi()` (Postgres, the production
   entrypoint) and `createApiFromContainer(repos)` (container-agnostic)**
   so the HTTP layer can be exercised against `createInMemoryContainer()`
   in tests without a live database, mirroring how every other flow test
   in `apps/api` already works.
3. **Tenancy placeholder: `x-org-id` header, not a JWT.** CLAUDE.md's API
   conventions call for `org_id` extracted from a Supabase JWT, never from
   the request body — there is no auth system yet (TD-006), so requiring a
   header (rather than trusting the body) is the closest honest
   approximation without inventing fake authentication. This is
   explicitly insecure and tracked as new debt (TD-027), not silently
   passed off as "done."
4. **Uniform error envelope `{ code, message, details, traceId }`**, per
   CLAUDE.md's API conventions — a 404 handler for unmatched routes and a
   final Express error handler that catches anything thrown by a
   controller (including the new `ApiError` used for the 401/400 cases
   `requireOrgId`/`param` raise).
5. **`apps/api/src/server.ts`** is the actual process entrypoint
   (`pnpm --filter @boss/api dev` / `start`) — `createHttpServer` itself
   stays importable and testable independent of `app.listen()`.

## Consequences

- TD-002 is resolved.
- No request body validation exists yet (TD-028) — a malformed body fails
  inside whatever service method receives it, not with a clean 400 at the
  boundary. Adding Zod schemas per route is the natural next increment,
  deferred rather than done partially here.
- `apps/api/src/__tests__/httpServerFlow.test.ts` exercises the transport
  itself (missing-header rejection, 404 envelope, a full create→fetch
  round trip, and the Mission Control snapshot route) against a real
  listening HTTP server bound to an in-memory container — distinct from
  every other flow test, which calls controllers directly without going
  through HTTP.

## Alternatives considered

- Fastify or a hand-rolled `node:http` router. Rejected: Express is the
  most widely understood option for a small, fully pass-through transport
  layer, and CLAUDE.md's tech stack section lists it as an acceptable
  choice; no feature here needs Fastify's extra performance or schema
  validation built-ins (those would still need to be hand-wired today).
- Wrapping each controller method in its own auth/validation middleware
  now. Rejected: there is no auth system to wire to yet (TD-006) — adding
  fake middleware would be worse than honestly tracking the gap as debt.
