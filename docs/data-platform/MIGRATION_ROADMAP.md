# BOSS Migration Roadmap

> Version: 1.0.0 | Current schema state, certified next migrations, and RC3 batch plan

---

## Current Schema State (Migration 0034)

34 migrations applied. 82 tables across 9 operating system domains.

### Migration History Summary

| Range | Domain | Key Changes |
|-------|--------|-------------|
| 0001–0005 | Identity | organizations, memberships, feature_flags, audit |
| 0006–0010 | Business Intelligence | businesses, profiles, DNA, health, MRI |
| 0011–0015 | Constraint Intelligence | constraint_instances, evidence, relationships, scores, priorities |
| 0016–0020 | Recommendation Intelligence | recommendation_instances, roadmaps, scores, priorities |
| 0021–0024 | Decision & Scenario | business_decisions, scenarios, execution_plans, verifications |
| 0025–0027 | KPI & Goals | kpi_readings, business_goals, executive_briefings |
| 0028–0031 | Customer & Sales | customers, leads, jobs, appointments, invoices, payments, reviews |
| 0032–0033 | Integration & Tool OS | integration_accounts, credentials, tool_executions, provider_health |
| 0034 | Loop Runtime | workflow_executions, scheduler_jobs, memory_records, runtime_jobs |

---

## Migration 0035 — RLS Policies

**Status**: Certified (see RLS_STRATEGY.md)
**Purpose**: Add production Row-Level Security policies to all 82 tables
**Risk**: Low — adds policies to existing tables; no schema changes
**Zero-downtime**: Yes

```sql
-- Key pattern for every table:
ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;
CREATE POLICY "<table>_org_isolation" ON <table>
  USING (org_id = boss_current_org_id() AND deleted_at IS NULL);
```

---

## Migration 0036 — Missing Indexes

**Status**: Certified (see INDEXING_STRATEGY.md)
**Purpose**: Add recommended indexes identified in indexing analysis
**Risk**: Low — `CREATE INDEX CONCURRENTLY` for zero-downtime
**Zero-downtime**: Yes (use CONCURRENTLY)

Key additions:
```sql
CREATE INDEX CONCURRENTLY idx_customers_fts ON customers
  USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(email,'')));
CREATE INDEX CONCURRENTLY idx_businesses_org ON businesses(org_id) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_provider_credentials_org_key ON provider_credentials(org_id, secret_key)
  WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY idx_feature_flags_org_key ON feature_flags(org_id, flag_key) WHERE deleted_at IS NULL;
```

---

## RC3 Batch 1 — Migrations 0037–0042

**Status**: Planned
**Purpose**: Add 6 new entities not yet in schema: Staff, Opportunity, Conversation, Task (standalone), Document, Estimate

### Migration 0037 — Staff

```sql
CREATE TABLE staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  user_id text NOT NULL,             -- auth.users external ID
  first_name text NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 100),
  last_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  role text NOT NULL,                -- job title (not BOSS role)
  department text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','on_leave')),
  hire_date date,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_staff_org_business ON staff(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_staff_user_id ON staff(org_id, user_id) WHERE deleted_at IS NULL;
```

### Migration 0038 — Opportunities

```sql
CREATE TABLE opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  stage text NOT NULL DEFAULT 'prospecting'
    CHECK (stage IN ('prospecting','qualification','proposal','negotiation','closed_won','closed_lost')),
  value_cents integer NOT NULL DEFAULT 0 CHECK (value_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  probability integer NOT NULL DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date date,
  assigned_to text,
  source text,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_opportunities_org_business ON opportunities(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_stage ON opportunities(org_id, stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_opportunities_customer ON opportunities(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
```

### Migration 0039 — Conversations

```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email','sms','phone','chat','in_person','other')),
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','archived')),
  assigned_to text,
  sentiment text CHECK (sentiment IN ('positive','neutral','negative')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_conversations_org_business ON conversations(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_conversations_customer ON conversations(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE INDEX idx_conversations_occurred ON conversations(org_id, occurred_at DESC) WHERE deleted_at IS NULL;
```

### Migration 0040 — Tasks (standalone)

```sql
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','done','cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to text,
  due_at timestamptz,
  completed_at timestamptz,
  parent_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_tasks_org_business ON tasks(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status ON tasks(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_assigned ON tasks(org_id, assigned_to) WHERE deleted_at IS NULL AND assigned_to IS NOT NULL;
```

### Migration 0041 — Documents

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  document_type text NOT NULL CHECK (document_type IN ('contract','proposal','report','template','other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','approved','signed','archived')),
  storage_url text,             -- Supabase Storage path (never public URL)
  mime_type text,
  size_bytes integer,
  version integer NOT NULL DEFAULT 1,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_documents_org_business ON documents(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_documents_type ON documents(org_id, document_type) WHERE deleted_at IS NULL;
```

### Migration 0042 — Estimates

```sql
CREATE TABLE estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  business_id uuid NOT NULL REFERENCES businesses(id),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  estimate_number text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','viewed','accepted','declined','expired','converted')),
  line_items jsonb NOT NULL DEFAULT '[]',  -- same shape as invoice line_items
  subtotal_cents integer NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  tax_cents integer NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  discount_cents integer NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  valid_until timestamptz,
  converted_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX uq_estimates_number ON estimates(org_id, estimate_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_estimates_org_business ON estimates(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_estimates_customer ON estimates(org_id, customer_id) WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE INDEX idx_estimates_status ON estimates(org_id, status) WHERE deleted_at IS NULL;
```

---

## RC3 Batch 2 — Migration 0043

**Purpose**: Repository + service updates for new entities; no new tables

---

## Migration 0046 — Secure Platform Super Administration

**Status**: Implemented; production verification pending
**Purpose**: Add cross-tenant platform roles, explicit permission catalog,
role-permission assignments, one-time founder bootstrap assignment, immutable
platform audit events, and RLS-protected read access.
**Risk**: High — introduces the platform control plane and founder bootstrap.
**Zero-downtime**: Yes for schema creation; bootstrap remains disabled until
the API deployment and production security gates pass.

Security requirements:

- Bootstrap identity comes from a verified Supabase session, never request-body
  `userId`.
- A verified email and active organization-owner relationship are required.
- Bootstrap uses a database advisory lock and rejects all duplicate attempts.
- Grant and success audit are committed in one transaction.
- Permissions are explicit database records; no wildcard permission exists.
- Direct authenticated-role mutation is revoked; the trusted API service owns
  mutations.

---

## Future Migrations (Post-RC3)

| Migration | Purpose | Priority |
|-----------|---------|---------|
| 0044 | Notifications table (in-app) | High |
| 0045 | Review responses (threaded) | Medium |
| 0047 | Customer segments (AI-computed cohorts) | Medium |
| 0048 | Subscription / billing tables | High |
| 0049 | Partition event_log by month | High (> 100M rows) |
| 0050 | Partition kpi_readings by month | Medium (> 50M rows) |
| 0051 | Materialized views (mv_business_health_summary) | Medium |

---

## Migration Checklist (Required for Every Migration)

- [ ] Migration file numbered sequentially in `/packages/db/migrations/`
- [ ] Idempotent (`IF NOT EXISTS` guards)
- [ ] `updated_at` trigger added for mutation tables
- [ ] RLS enabled and policies created
- [ ] Indexes for all foreign keys
- [ ] Zero-downtime strategy verified (use `CONCURRENTLY` for indexes)
- [ ] Pre-migration backup taken
- [ ] Rollback script documented
- [ ] Migration tested in staging before production
