# BOSS Data Governance

> Version: 1.0.0 | Data ownership, retention, compliance, and lifecycle policies

---

## Data Ownership

| Data Domain | Owner | Steward |
|-------------|-------|---------|
| Platform infrastructure data | BOSS (Anthropic) | Platform engineering |
| Organization data | Customer (org owner) | BOSS |
| Business intelligence data | Customer | BOSS |
| AI-generated insights | BOSS (generated) / Customer (owned) | BOSS |
| Customer PII | Customer | Customer |
| Audit logs | Immutable shared ownership | BOSS |
| Credentials (encrypted) | Customer | BOSS (vault operator) |

---

## Data Classification

| Class | Examples | Controls |
|-------|---------|---------|
| **Restricted** | Credential ciphertext, vault keys, auth tokens | Never logged, never returned via API, encrypted at rest |
| **Confidential** | Customer PII (email, phone, address), financial data | Field-level access control, masked in logs |
| **Internal** | Business health scores, AI reasoning, org settings | Role-gated, not public |
| **Public** | Business name, invoice numbers, appointment titles | All authenticated org members |

---

## Retention Policies

| Table | Retention | Basis |
|-------|----------|-------|
| `event_log` | 2 years (hot), 7 years (cold archive) | Audit / compliance |
| `identity_audit_events` | 7 years | Security compliance |
| `provider_credential_audit` | 7 years | Security compliance |
| `tool_audit_history` | 1 year | Operational audit |
| `kpi_readings` | 5 years | Business trend analysis |
| `business_health` | 5 years | Trend history |
| `workflow_executions` | 1 year (active), 3 years (archive) | Operational |
| `dead_letter_queue` | 30 days | Operational recovery |
| `memory_records` (TTL-based) | Per `expires_at`; null = permanent | AI context |
| `notification_deliveries` | 90 days | Operational |
| `provider_evidence` | 1 year | Debugging / compliance |
| Customer data (deleted org) | 30-day grace period, then purge | GDPR Art. 17 |
| Backups | 30 days (daily), 1 year (monthly snapshots) | Disaster recovery |

---

## Soft Delete Policy

All business data uses soft deletes (`deleted_at IS NOT NULL`) rather than hard deletes.

| Scenario | Behavior |
|---------|---------|
| User deletes a customer | `deleted_at = now()`; data retained; RLS excludes from queries |
| User deletes a lead | Soft delete; `converted_customer_id` retained for history |
| Org cancels subscription | Org + all children soft-deleted after 30-day grace |
| Hard delete | Only permitted by platform_admin via service role after retention period |

---

## GDPR / Privacy Compliance

### Right to Erasure (Art. 17)
- Customer PII deletion: anonymize (overwrite `first_name='Deleted'`, `last_name=''`, `email=NULL`, `phone=NULL`, `address=NULL`) rather than hard delete
- `total_revenue` retained as it is financial record
- Event log entries referencing the customer are retained (anonymized ID reference)

### Right to Portability (Art. 20)
- Export endpoint (future): `/v1/orgs/:orgId/export` produces JSON dump of all org data
- Scope: all tables except audit logs and platform infrastructure

### Data Minimization
- Phone numbers are optional — never required
- Health score is nullable — only populated when AI has sufficient data
- `deleted_at` is used instead of storing reason for deletion by default

### Processor Agreements
| Sub-processor | Data Shared | Purpose |
|---------------|-------------|---------|
| Anthropic Claude API | Business context (no PII unless in MRI responses) | AI inference |
| Supabase | All org data | Database + Auth + Storage |
| Vercel | No persistent data | Frontend hosting |
| Sentry | Error stack traces (anonymized) | Error monitoring |
| PostHog | Usage events (anonymized user IDs) | Analytics |

---

## Data Quality Rules

| Rule | Enforcement |
|------|-------------|
| No orphan records | FK constraints + RLS |
| No duplicate memberships | `UNIQUE (org_id, user_id)` on memberships |
| No duplicate invoice numbers | `UNIQUE INDEX uq_invoices_number ON invoices(org_id, invoice_number)` |
| Referential integrity on payments | RESTRICT delete on invoices with payments |
| Required fields never null | `NOT NULL` constraints + Zod validation |
| Monetary values in cents | Application convention + documentation |

---

## Backup Strategy

| Tier | Frequency | Retention | Storage |
|------|-----------|----------|---------|
| Point-in-time recovery | Continuous (Supabase) | 7 days | Supabase-managed |
| Daily snapshots | Daily 02:00 UTC | 30 days | S3 / GCS |
| Monthly snapshots | 1st of month | 1 year | S3 / GCS (cold) |
| Pre-migration backup | Before every migration | Indefinite | Manual |

---

## Schema Migration Governance

| Rule | Enforcement |
|------|-------------|
| All schema changes via migrations | `/packages/db/migrations/` numbered sequentially |
| No destructive migrations in production | Review gate required |
| Migrations must be idempotent | `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` |
| RLS enabled on every new table | Checklist item in PR template |
| Updated_at trigger on every mutation table | Migration template |
| Indexes for every FK | Review checklist |
| Zero-downtime strategy for large tables | Add column nullable → backfill → add NOT NULL |

---

## Incident Response — Data Breach

1. **Detect**: Anomaly in `identity_audit_events` or `tool_audit_history`
2. **Contain**: Revoke affected org's API tokens (suspend org)
3. **Assess**: Query audit logs to determine scope of access
4. **Notify**: If PII exposed, notify affected org owner within 72 hours (GDPR Art. 33)
5. **Remediate**: Rotate affected credentials via `provider_credential_audit`
6. **Post-mortem**: Document in incident log

---

## Access Logging Requirements

Every data access to sensitive/confidential data must log:

| Field | Value |
|-------|-------|
| `actor_id` | user_id or agent key |
| `org_id` | Organization |
| `resource_type` | Table name |
| `resource_id` | Record ID |
| `action` | read / write / delete |
| `occurred_at` | Timestamp |
| `ip_address` | For human access |
| `trace_id` | For debugging |

Stored in `identity_audit_events` for human actions, `tool_audit_history` for agent actions.
