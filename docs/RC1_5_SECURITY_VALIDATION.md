# RC1.5 Security Validation

**Date:** 2026-07-03  
**Assessment:** PASS — 14/14 security tests passing

---

## Tenant Isolation

### Verified Isolation Points

| Repository | Cross-Tenant Attack | Result |
|-----------|--------------------|----|
| BusinessRepository | `list("org-A")` cannot return `org-B` records | BLOCKED |
| BusinessHealthRepository | `findByBusinessId("org-A", bizB.id)` returns `null` | BLOCKED |
| WorkflowExecutionRepository | `listByBusinessId("org-D", "biz-C")` returns `[]` | BLOCKED |
| TaskExecutionRepository | `listByWorkflowExecutionId("org-F", wf.id)` returns `[]` | BLOCKED |
| SchedulerJobRepository | `listByBusiness("org-G", "biz-H")` returns `[]` | BLOCKED |
| ToolExecutionRepository | `listByBusinessId("org-I", "biz-J")` returns `[]` | BLOCKED |
| DeadLetterRepository | `listByBusinessId("org-A", "biz-B")` returns `[]` | BLOCKED |
| EventLogRepository | `listByOrgId("org-A")` returns only org-A events | BLOCKED |

All isolation checks passed without explicit RLS (in-memory enforces `orgId` at query layer). Postgres RLS migrations are deployed on all tables.

---

## Authentication (JWT)

| Scenario | Expected | Result |
|---------|----------|--------|
| No `Authorization` header | `missing_token` error | PASS |
| Expired JWT (`exp` in past) | `invalid_token` error | PASS |
| Wrong HMAC secret | `invalid_token` error | PASS |
| Tampered payload (keep sig) | `invalid_token` error | PASS |
| Valid token | `org_id` extracted correctly | PASS |

JWT validation uses `jose` library with HS256. `SUPABASE_JWT_SECRET` required at runtime — the app refuses to start without it.

---

## RBAC (Role-Based Access Control)

| Role Hierarchy | owner > admin > member > viewer |
|---|---|
| owner can satisfy | owner, admin, member, viewer |
| admin can satisfy | admin, member, viewer |
| member can satisfy | member, viewer |
| viewer can satisfy | viewer only |

Enforcement point: `requireRole(req, minRole)` in `apps/api/src/http/auth.ts`. Returns `{ orgId, role }` or throws `{ code: "insufficient_role" }`.

Spoofing attempt (attacker includes `org_id` in request body): **BLOCKED** — `org_id` is extracted exclusively from JWT claims.

---

## Provider Credential Isolation

Integration accounts (provider credentials) are scoped to `(orgId, businessId)` pairs. Verified:
- `connectIntegration("org-A", bizA, "smtp")` → org-A SMTP visible only to org-A
- `connectIntegration("org-B", bizB, "twilio")` → org-B Twilio visible only to org-B  
- Cross-tenant `listIntegrations("org-A", bizB.id)` → returns `[]`

---

## Secret Vault

Provider secrets resolved by `SecretVault` are keyed by `(orgId, providerKey)`. Secret resolution never leaks across tenants:
- `EnvSecretStore` reads from environment variables (per-provider, not per-tenant)
- `EncryptedInMemorySecretStore` keys secrets by tenant
- Postgres implementation uses RLS to prevent cross-tenant secret reads

---

## Audit Trail

Every domain mutation produces a durable event log entry with:
- `orgId` — which tenant performed the action
- `type` — what happened (e.g. `business.mri.completed`)
- `occurredAt` — ISO timestamp
- `correlationId` — links related events
- `causationId` — traces causal chain

Tool executions additionally record `requestedBy` (actor identity).

---

## Known Gaps (RC2 Prerequisites)

1. **Postgres RLS test coverage** — in-memory tests verify service-layer isolation; RLS policy tests against a real Postgres instance are deferred to RC2 integration environment.
2. **Rate limiting** — no per-tenant rate limiting implemented. Needed before public launch (see TECH_DEBT.md).
3. **Audit log actor identity** — currently `requestedBy` is a string (from JWT claim). Full actor model (user ID + org role) to be added in RC2.
