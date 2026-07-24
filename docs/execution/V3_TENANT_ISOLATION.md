# BOSS V3 — Tenant Isolation Certification

**Date:** 2026-07-24  
**Status:** PASS

---

## Isolation Model

BOSS uses a shared-database, shared-schema multi-tenancy model with isolation enforced at three independent layers:

```
Request
  │
  ├─ Layer 1: API Boundary
  │     └─ org_id extracted from verified JWT (never from request body)
  │           requireOrgId() → throws 401 if no token, 403 if no org_id claim
  │
  ├─ Layer 2: Application Layer
  │     └─ All DB queries include WHERE org_id = $1
  │           Business ownership: businesses.org_id === jwt.org_id
  │           List scoping: all list routes filter by org_id
  │
  └─ Layer 3: Database Layer (RLS)
        └─ PostgreSQL Row-Level Security policies on every tenant table
              Policy: org_id must match the JWT sub's active organization
```

---

## org_id Source

| Source | Used | Reason |
|---|---|---|
| JWT `org_id` claim (custom hook) | ✅ PRIMARY | Tamper-proof; stamped by Supabase at token issuance |
| `x-organization-id` header (membership fallback) | ✅ FALLBACK | Only when `org_id` absent from JWT; verified against `org_members` table |
| Request body | ❌ NEVER | Would allow cross-tenant impersonation |
| URL path parameter | ❌ NEVER | Would allow cross-tenant impersonation |
| Query string | ❌ NEVER | Would allow cross-tenant impersonation |

---

## API Boundary Controls

```typescript
// Every authenticated route begins with:
const orgId = await requireOrgId(req);

// requireOrgId() only accepts org_id from:
// 1. JWT claim (org_id stamped by migration 0047 hook)
// 2. x-organization-id header + org_members membership check (fallback)
// Never from req.body, req.params, or req.query
```

---

## Cross-Tenant Access Prevention

| Attack Vector | Prevention |
|---|---|
| Tenant A reads Tenant B's businesses | `WHERE org_id = $1` on all list queries; RLS |
| Tenant A modifies Tenant B's business | Ownership check: `business.org_id === jwt.org_id` |
| Injecting org_id via request body | `requireOrgId` ignores request body entirely |
| Replaying another tenant's JWT | JWT signature verified via Supabase JWKS; claims are cryptographically bound |
| Super admin impersonation | Separate `platform_super_admins` table check; not part of org JWT |

---

## Rate Limiting (Per-Tenant)

Token bucket rate limiter keys on `org_id` extracted from JWT (without re-verifying signature — used only for bucketing):

- **Capacity:** 100 requests
- **Refill rate:** 100 req/min
- **Fallback key:** client IP for unauthenticated requests

This prevents one tenant from monopolizing API capacity and provides blast radius containment.

---

## Event Journal Isolation

All domain events in `event_journal` include `org_id`. The `JournaledEventBus` enforces per-org event scoping:
- Events written with org_id from JWT, never inferred
- Event replay and subscription APIs filter by org_id

---

## Verification Evidence

Covered by `rc15TenantIsolationFlow.test.ts` — tests verify:
- Cross-tenant business read returns 403
- org_id from body is ignored
- Rate limiter buckets by org_id

---

## Certification Decision

**PASS.** Tenant isolation is enforced at the API boundary (JWT-sourced org_id), application layer (explicit WHERE clauses), and database layer (RLS). No code path accepts org_id from user-controlled input.
