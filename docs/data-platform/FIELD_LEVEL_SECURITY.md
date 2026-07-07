# BOSS Field-Level Security

> Version: 1.0.0 | Per-field access control, masking, and sensitive data handling

---

## Field Classification

| Class | Description | Examples |
|-------|-------------|---------|
| `PUBLIC` | Visible to all authenticated org members | business name, invoice number |
| `INTERNAL` | Visible to owner/admin/operator; hidden from viewer | health scores, AI reasoning |
| `SENSITIVE` | Visible to owner/admin only | financial totals, customer PII |
| `CONFIDENTIAL` | Never returned via API in plaintext | credential ciphertext, vault keys |
| `SYSTEM` | Server-set; clients can never write | id, org_id, created_at, updated_at |
| `COMPUTED` | Derived; clients can never write | total_revenue, overall_score |
| `IMMUTABLE` | Set once; clients can never update | slug, industry, created_at |

---

## Provider Credentials — Strictest Controls

| Field | Class | Read | Write |
|-------|-------|------|-------|
| `secret_key` | SENSITIVE | owner/admin only | owner/admin only |
| `ciphertext` | CONFIDENTIAL | Server-side only (never API) | Server-side only |
| `iv` | CONFIDENTIAL | Server-side only | Server-side only |
| `auth_tag` | CONFIDENTIAL | Server-side only | Server-side only |
| `provider_key` | INTERNAL | owner/admin/operator | owner/admin |
| `rotated_at` | INTERNAL | owner/admin | System only |
| `expires_at` | INTERNAL | owner/admin | owner/admin |

> The credential vault values (`ciphertext`, `iv`, `auth_tag`) are never exposed through any API endpoint. They are only accessed by server-side tool execution infrastructure using the `BOSS_SECRET_VAULT_KEY` environment variable.

---

## Customer PII Fields

| Field | Class | Viewer | Operator | Admin/Owner | AI Agent |
|-------|-------|--------|----------|------------|---------|
| `first_name` | SENSITIVE | ❌ | ✅ | ✅ | ✅ |
| `last_name` | SENSITIVE | ❌ | ✅ | ✅ | ✅ |
| `email` | SENSITIVE | ❌ | ✅ | ✅ | ✅ (masked in logs) |
| `phone` | SENSITIVE | ❌ | ✅ | ✅ | ✅ (masked in logs) |
| `address` | SENSITIVE | ❌ | ✅ | ✅ | ✅ |
| `total_revenue` | SENSITIVE | ❌ | ✅ | ✅ | ✅ |
| `health_score` | INTERNAL | ❌ | ✅ | ✅ | ✅ |
| `tags` | INTERNAL | ❌ | ✅ | ✅ | ✅ |
| `source` | INTERNAL | ❌ | ✅ | ✅ | ✅ |

---

## Financial Fields

| Table.Field | Class | Finance | Operator | Admin/Owner | Viewer |
|------------|-------|---------|----------|------------|--------|
| `invoices.total_cents` | SENSITIVE | ✅ | ✅ | ✅ | ❌ |
| `invoices.subtotal_cents` | SENSITIVE | ✅ | ✅ | ✅ | ❌ |
| `invoices.tax_cents` | SENSITIVE | ✅ | ✅ | ✅ | ❌ |
| `invoices.line_items` | SENSITIVE | ✅ | ✅ | ✅ | ❌ |
| `payments.amount_cents` | SENSITIVE | ✅ | ❌ | ✅ | ❌ |
| `payments.reference` | SENSITIVE | ✅ | ❌ | ✅ | ❌ |
| `businesses.annual_revenue` | SENSITIVE | ✅ | ❌ | ✅ | ❌ |

---

## AI Intelligence Fields

These fields contain proprietary AI-generated insights. Viewers see summaries; raw scores are restricted.

| Field | Viewer | Operator | Admin/Owner | AI Agent |
|-------|--------|----------|------------|---------|
| `business_health.overall_score` | 📖 | ✅ | ✅ | ✅ |
| `business_health_dimensions.*` | ❌ | ✅ | ✅ | ✅ |
| `business_dna.*` | ❌ | 📖 | ✅ | ✅ |
| `constraint_instances.confidence` | ❌ | ✅ | ✅ | ✅ |
| `constraint_scores.*` | ❌ | ✅ | ✅ | ✅ |
| `recommendation_instances.confidence` | ❌ | ✅ | ✅ | ✅ |
| `recommendation_scores.*` | ❌ | ✅ | ✅ | ✅ |
| `business_decisions.confidence_score` | ❌ | 📖 | ✅ | ✅ |
| `business_decisions.options` | ❌ | ✅ | ✅ | ✅ |

---

## System Fields — Never Client-Writable

These fields are rejected if present in any create or update request body:

| Field | Present On |
|-------|-----------|
| `id` | All tables |
| `org_id` | All tables |
| `created_at` | All tables |
| `updated_at` | All tables |
| `deleted_at` | All tables (use soft-delete endpoint) |

---

## Audit Log Field Access

Audit logs may contain sensitive information from mutations. Access rules:

| Table | Read Access |
|-------|------------|
| `event_log` | owner/admin only (via observability endpoints) |
| `identity_audit_events` | owner/admin only; platform_admin for all orgs |
| `tool_audit_history` | owner/admin; integration role for own executions |
| `provider_credential_audit` | owner only |

---

## Data Masking Rules

Applied in application layer before API responses are serialized:

| Context | Rule |
|---------|------|
| Email in logs | Masked to `u****@domain.com` |
| Phone in logs | Masked to `+1***XXXX` |
| `ciphertext` | Never appears in any API response |
| `BOSS_SECRET_VAULT_KEY` | Never logged; never in API response |
| Payment `reference` | Shown as last 4 chars only in list views |
| Credit card data | Never stored; only provider token stored |

---

## Response Field Stripping by Role

The API serialization layer strips fields the requesting role cannot see. Unknown roles receive minimum public fields only.

```typescript
// Pseudocode: field stripping on customer response
function serializeCustomer(customer, role) {
  const base = { id, business_id, status, created_at };
  if (role === 'viewer') return base;
  const sensitive = { first_name, last_name, email, phone, address, tags, source };
  const financial = { total_revenue };
  const ai = { health_score };
  if (['operator', 'sales', 'staff'].includes(role)) return { ...base, ...sensitive };
  if (['admin', 'owner', 'finance'].includes(role)) return { ...base, ...sensitive, ...financial, ...ai };
  if (role === 'ai_agent') return { ...base, ...sensitive, ...financial, ...ai };
  return base;
}
```
