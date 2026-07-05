# BOSS Security Model

> Version: 1.0.0 | Covers: Authentication, Authorization, Tenant Isolation, Encryption, Audit

---

## Security Layers

```
┌─────────────────────────────────────────────────┐
│  1. Authentication (Supabase JWT / Bearer token) │
├─────────────────────────────────────────────────┤
│  2. org_id Extraction (JWT claim, never body)    │
├─────────────────────────────────────────────────┤
│  3. API Validation (Zod + input boundary)        │
├─────────────────────────────────────────────────┤
│  4. Permission Policies (tool-level RBAC)        │
├─────────────────────────────────────────────────┤
│  5. Row-Level Security (Postgres RLS)            │
├─────────────────────────────────────────────────┤
│  6. Field-Level Security (API response filter)   │
├─────────────────────────────────────────────────┤
│  7. Secret Vault (AES-256-GCM)                   │
├─────────────────────────────────────────────────┤
│  8. Audit Trail (event_log + identity_audit)     │
└─────────────────────────────────────────────────┘
```

---

## 1. Authentication

- **Provider**: Supabase Auth (JWT-based)
- **Token format**: Bearer JWT in `Authorization` header
- **Claims used**: `sub` (user_id), `org_id` (active organization)
- **Session context**: `boss_current_org_id()` and `boss_current_user_id()` PostgreSQL functions read JWT claims from `request.jwt.claims` setting, with fallback to `app.current_org_id` / `app.current_user_id` session variables for server-side processes

---

## 2. Tenant Isolation

**Rule**: `org_id` is ALWAYS extracted from the authenticated JWT, never from the request body.

Every query at the API boundary automatically scopes to the caller's org via:
1. Service layer passes `orgId` (from JWT) as first parameter to every repository call
2. Repository queries always include `WHERE org_id = $1`
3. RLS policies provide defense-in-depth at the database level

**Cross-tenant data access is architecturally impossible** through the API layer:
- No endpoint accepts `org_id` as a user-supplied parameter
- Database RLS rejects any query that would return another tenant's data

---

## 3. Row-Level Security (RLS)

### Tables with RLS Enabled

All tables where RLS is enabled use the same pattern:

```sql
CREATE POLICY <table>_tenant_policy ON <table>
  USING (org_id = boss_current_org_id())
  WITH CHECK (org_id = boss_current_org_id());
```

**Runtime tables (0018)**:
- `workflow_executions`, `runtime_jobs`, `runtime_schedules`, `runtime_events`
- `agent_executions`, `runtime_checkpoints`

**Diagnostic tables (0020)**:
- `diagnostic_reports`, `diagnostic_area_scores`, `diagnostic_root_causes`
- `diagnostic_opportunities`, `diagnostic_maturity_assessments`, `diagnostic_priority_items`

**Discovery tables (0022)**:
- `business_discoveries`, `business_context_versions`, `business_discovery_history`

**Knowledge graph tables (0023)**:
- `business_graphs`, `business_graph_nodes`, `business_graph_edges`
- `business_graph_snapshots`, `business_graph_history`

**Product journey (0019)**:
- `mvp_journey_events`

**Operational tables (0026–0030)**:
- `jobs`, `appointments`, `invoices`, `payments`, `customer_reviews`

**Identity tables (0021)** use more nuanced policies:
- `organizations`: SELECT only if user is active member
- `organization_memberships`: SELECT own rows only
- `user_tenant_preferences`: self-only USING + WITH CHECK
- `identity_audit_events`: own actor rows OR org-member rows

### Tables Requiring RLS (Roadmap)

The following tables were created before the RLS pattern was standardized and require migration to enable RLS:

```
businesses, business_profiles, business_mri, business_dna, business_health,
business_capabilities, business_timeline, constraint_instances, constraint_scores,
constraint_priorities, recommendation_instances, recommendation_scores,
recommendation_priorities, transformation_roadmaps, integration_accounts,
tool_executions, memory_records, customers, customer_interactions, leads,
kpi_readings, business_goals, executive_briefings, notification_deliveries
```

See MIGRATION_ROADMAP.md for RLS rollout plan.

---

## 4. Secret Vault

Provider credentials are encrypted at rest using **AES-256-GCM**:

```
Environment Variable: BOSS_SECRET_VAULT_KEY (64-char hex = 32 bytes)

Encryption:
  plaintext → AES-256-GCM → { iv, ciphertext, authTag }
  stored in provider_credentials table

Decryption:
  iv + ciphertext + authTag + key → plaintext (authenticated)
```

**Key rotation**: Secrets are rotated by calling `SecretStore.rotate()` which re-encrypts and writes a `rotate` audit entry.

**Audit trail**: Every `get`, `put`, `rotate`, `delete` operation is recorded in `provider_credential_audit`.

**Fallback**: When `BOSS_SECRET_VAULT_KEY` is not set, the system falls back to `EnvSecretStore` (reads from environment variables directly).

---

## 5. Permission Policies (Tool-Level RBAC)

The `permission_policies` table governs which roles may invoke which tools:

```sql
permission_policies (
  business_id, tool_key, role_key,
  allowed boolean,
  approval (auto | approval_required | executive_review | manual_only),
  rate_limit_per_minute
)
```

**Approval escalation**:
- `auto`: AI agents may execute without human approval
- `approval_required`: Requires manager or owner confirmation
- `executive_review`: Requires owner or executive sign-off
- `manual_only`: Cannot be automated; human must act

---

## 6. API Security

| Concern | Implementation |
|---------|---------------|
| Input validation | Zod schemas at every API boundary |
| SQL injection | Parameterized queries via `query($1, $2, ...)` — no string interpolation |
| XSS | JSON API — no HTML rendered server-side |
| CSRF | JWT Bearer tokens (not cookies) — no CSRF surface |
| Rate limiting | Per-tool `rate_limit_per_minute` in permission_policies |
| Request tracing | `trace_id` propagated through all service calls and logged to audit |

---

## 7. Data Classification

| Classification | Examples | Storage | API Visibility |
|---------------|---------|---------|---------------|
| **Public** | Business name, industry | Standard | Full |
| **Internal** | Health scores, KPIs, recommendations | Standard | Org members only |
| **Confidential** | Business DNA, financial data | Standard | Role-restricted |
| **Restricted** | Provider API keys, credentials | AES-256-GCM encrypted | Never in API response |
| **PII** | Customer email, phone, address | Standard + deletion support | Role-restricted |

---

## 8. Audit Trail

All security-relevant actions are recorded in two audit systems:

**`identity_audit_events`** — authentication and authorization:
- Login, logout, role changes
- Permission grants/revocations
- `outcome`: success | failure | denied

**`event_log`** — domain event audit:
- Every state change in every entity
- `type`, `payload`, `occurred_at`, `org_id`, `correlation_id`

**`tool_audit_history`** — tool execution audit:
- Every tool invocation with actor, input hash, outcome

**`provider_credential_audit`** — secret access:
- Every get/put/rotate/delete with actor and timestamp

**`platform.audit.recorded`** — explicit audit writes via `PlatformSdk.audit()`:
- High-value business events with custom action/actor/resource

---

## 9. Compliance Considerations

| Requirement | Implementation |
|------------|---------------|
| GDPR data deletion | Soft delete + `deleted_at` on all PII tables |
| Data residency | `org_id` partitioning enables tenant-specific routing |
| Audit retention | `event_log` and `identity_audit_events` are append-only |
| Credential rotation | `SecretStore.rotate()` + audit trail |
| Least privilege | `permission_policies` enforces per-tool, per-role access |
| Data minimization | AI agents receive only required fields (see AI_DATA_MODEL.md) |
