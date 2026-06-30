# RC1 Security Assessment

**Date:** 2026-06-30

---

## Authentication

| Control | Status | Notes |
|---|---|---|
| JWT signature verification | ✓ IMPLEMENTED | `jose` jwtVerify with HS256 |
| org_id claim enforcement | ✓ IMPLEMENTED | 403 on missing/invalid claim |
| Role-based access control | ✓ IMPLEMENTED | `requireRole()` with 4-level hierarchy |
| Token expiry | ✓ IMPLEMENTED | 24h expiry enforced by jwtVerify |
| Dev token endpoint gated | ✓ IMPLEMENTED | `NODE_ENV !== "production"` guard |
| Supabase custom token hook | ✗ MISSING (TD-030) | Must stamp org_id + role on real sign-in |

---

## Credential Management

| Control | Status | Notes |
|---|---|---|
| Secrets encrypted at rest | ✓ IMPLEMENTED | AES-256-GCM per secret |
| Per-tenant secret isolation | ✓ IMPLEMENTED | orgId:key tuple scoping |
| Rotation with audit trail | ✓ IMPLEMENTED | Actor + timestamp recorded |
| Version history | ✓ IMPLEMENTED | `listVersions()` tracks all rotations |
| Production KMS backend | ✗ MISSING (TD-014) | env vars are read-only, no distribution |
| Secret plaintext in logs | ✓ PREVENTED | Audit entries contain action + actor only |

---

## Data Isolation

| Control | Status | Notes |
|---|---|---|
| org_id on every table | ✓ IMPLEMENTED | All migrations include org_id NOT NULL |
| JWT-derived tenant context | ✓ IMPLEMENTED | org_id never trusted from request body |
| RLS migration templates | ✓ DEFINED | Not yet applied to Supabase project |

---

## Input Validation

| Control | Status | Notes |
|---|---|---|
| Zod validation on all mutating routes | ✓ IMPLEMENTED (TD-028) | Returns 400 with field-level errors |
| Auth before validation ordering | ✓ IMPLEMENTED | 401 before 400 |
| SQL injection prevention | ✓ IMPLEMENTED | Parameterized queries throughout |

---

## Event & Audit

| Control | Status | Notes |
|---|---|---|
| Domain events for all state changes | ✓ IMPLEMENTED | Every lifecycle transition emits event |
| Durable event log | ✓ IMPLEMENTED (RC1) | DB-persisted with org_id + correlation_id |
| Secret operation audit | ✓ IMPLEMENTED | get/put/rotate/delete logged with actor |
| Tool execution audit records | ✓ IMPLEMENTED | ToolAuditRecord stored per execution |

---

## Risks Remaining for Production

1. **TD-030 CRITICAL**: Without the Supabase custom access-token hook, any user can mint a dev token for any org_id in non-production environments. The dev token endpoint MUST be disabled in production (`NODE_ENV=production` check is present but must be verified in deployment).

2. **TD-014 HIGH**: Credentials stored as env vars on the server process. Must migrate to a dedicated secrets manager before handling customer payment or CRM credentials.

3. **RLS NOT ACTIVE**: Row-Level Security policies are defined architecturally but not applied to the Supabase project. Without RLS, any JWT with a valid signature can query any org's data if it bypasses the API.
