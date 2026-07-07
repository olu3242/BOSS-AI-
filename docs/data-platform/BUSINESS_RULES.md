# BOSS Business Rules

> Version: 1.0.0 | Invariants, policies, and cross-entity rules enforced by the platform

---

## Tenancy Rules

| Rule | Enforcement |
|------|-------------|
| Every entity belongs to exactly one org | `org_id NOT NULL` + FK |
| `org_id` is always extracted from JWT, never from request body | API middleware |
| Queries always include `org_id` filter | Repository layer |
| Cross-org data access is never permitted | RLS policies |
| Platform admins bypass RLS via service role | Supabase service_role key |

---

## Identity Rules

**R-ID-01**: An organization must have exactly one `owner` membership at all times.

**R-ID-02**: The last owner cannot be removed or downgraded. Ownership transfer requires adding a new owner first.

**R-ID-03**: An organization `slug` is immutable after creation. Changing it would break external links and integrations.

**R-ID-04**: A suspended organization's API tokens are rejected at the gateway. No data mutation is allowed while suspended.

**R-ID-05**: `feature_flags` resolution order: org-scoped override → global override → environment variable → hardcoded default.

---

## Business Rules

**R-BIZ-01**: A business's `industry` field is immutable after creation. Industry pack selection determines which AI employees, KPIs, and workflows are available.

**R-BIZ-02**: A business can have at most one active `business_profile`, one active `business_dna`, and the latest `business_health` record is the authoritative score.

**R-BIZ-03**: `business_health` records are append-only. The most recent record (by `created_at`) is the active score. Old records provide trend history.

**R-BIZ-04**: `business_capabilities` reflect what the business currently has enabled (integrations, tool packs). Capabilities gate which workflows and AI employees are active.

---

## MRI Rules

**R-MRI-01**: An MRI session must be `in_progress` to accept responses. Responding to a `completed` MRI is rejected.

**R-MRI-02**: A question key is immutable on a response once set. The answer value can be updated, but it is still associated with the original question.

**R-MRI-03**: MRI completion (`/complete`) is only allowed when all `required` questions have responses.

**R-MRI-04**: Completing an MRI automatically queues a DNA generation job (`POST /dna/generate`).

---

## Constraint Rules

**R-CON-01**: `confidence` must be between 0 and 1 inclusive. AI-generated constraints must include confidence; manual constraints default to 1.0.

**R-CON-02**: Constraint `version` is incremented on every status change or significant update. This enables optimistic locking.

**R-CON-03**: All constraint status transitions are logged to `constraint_history` before the transition is applied.

**R-CON-04**: A `critical` severity constraint with `confidence >= 0.8` triggers an immediate notification to org owner and admins.

---

## Recommendation Rules

**R-REC-01**: A recommendation cannot be approved if its linked constraints are all `resolved` or `dismissed` — the need no longer exists.

**R-REC-02**: Approving a recommendation with `approval = 'executive_review'` requires the `owner` or `admin` role. The `operator` role generates an approval request instead.

**R-REC-03**: When a recommendation is approved, a workflow execution is automatically generated if a `workflow_key` is associated.

**R-REC-04**: Dismissing a recommendation records a `dismissal_reason` which feeds the AI learning loop.

**R-REC-05**: A recommendation with `stage = 'quick_wins'` and `estimated_effort_hours <= 2` is eligible for auto-execution if the approval policy is `auto`.

---

## Decision Rules

**R-DEC-01**: A decision's `options` array must have at least 2 options. Single-option decisions are rejected.

**R-DEC-02**: `selected_option_key` must match exactly one of the keys in `options`. Selecting a non-existent key is rejected with `DECISION_OPTION_KEY_MISMATCH`.

**R-DEC-03**: `actual_roi` can only be set via the `/measure` endpoint after the decision is in `completed` status.

**R-DEC-04**: Archiving a decision in `executing` status requires explicit confirmation — the parameter `force: true` must be passed.

**R-DEC-05**: A decision that exceeds its `expected_roi` by more than 20% automatically triggers a `decision.measured` event which feeds executive briefings.

---

## Customer & Sales Rules

**R-CUS-01**: `total_revenue` on customers is a computed field — the sum of all `payments.amount_cents` where `status = 'completed'` for that customer. It is never set directly.

**R-CUS-02**: `health_score` is AI-computed from interaction frequency, payment history, and review sentiment. It is never set via API.

**R-CUS-03**: A lead cannot be converted if it is already `converted` or `lost`.

**R-CUS-04**: Converting a lead creates a new `customer` record and links it via `leads.converted_customer_id`. The lead status becomes `converted` and `converted_at` is server-set.

**R-CUS-05**: An invoice's `total_cents` must equal `subtotal_cents + tax_cents - discount_cents`. Requests where this is violated are rejected.

**R-CUS-06**: Payments can only be recorded against invoices in `sent`, `viewed`, or `overdue` status. Paying a `draft` or `cancelled` invoice is rejected.

**R-CUS-07**: A `paid` invoice cannot be cancelled. It can only be `refunded`.

**R-CUS-08**: Appointments require `start_at < end_at`. Zero-duration appointments are rejected.

**R-CUS-09**: When an invoice moves to `overdue`, a notification is sent to the assigned customer contact and the org's finance role members.

---

## Financial Rules

**R-FIN-01**: All monetary values are stored in cents (integer) to avoid floating-point precision issues. The `currency` field determines the denomination.

**R-FIN-02**: Only `owner`, `admin`, and `finance` roles can record payments.

**R-FIN-03**: Refunds require the original payment to be in `completed` status. Refunding a `failed` payment is rejected.

**R-FIN-04**: Invoice currency must match payment currency. Cross-currency payments are rejected.

---

## Tool & Integration Rules

**R-INT-01**: Provider credential values are never returned by any API endpoint. The decryption key is accessible only to server-side tool execution infrastructure.

**R-INT-02**: Every tool execution is logged to `tool_audit_history` before the external call is made.

**R-INT-03**: Tool executions with `approval_required` or `executive_review` policies generate pending approval requests instead of executing immediately.

**R-INT-04**: A failed tool execution is retried up to `attempt_count` times (default 3) with exponential backoff before moving to the dead letter queue.

**R-INT-05**: Uninstalling an integration (`/marketplace/uninstall`) revokes the `integration_account`, soft-deletes associated `credential_references`, and disables dependent `scheduler_jobs`.

---

## Workflow & Scheduler Rules

**R-WF-01**: Workflow executions are append-only state machines. No execution record is mutated in place — state transitions are appended to `execution_events`.

**R-WF-02**: A workflow with an approval gate pauses at the gate until approved or rejected. Timeout behavior is defined per gate.

**R-WF-03**: Recurring scheduler jobs with `max_runs` set stop after reaching `max_runs`. The job state becomes `completed`.

**R-WF-04**: Scheduler cron expressions must be valid POSIX cron (5-field). Invalid expressions are rejected at creation.

**R-WF-05**: Dead-lettered workflow executions are retained for 30 days before automatic cleanup.

---

## AI Agent Rules

**R-AI-01**: AI agents can never read raw credential values. They receive only tool execution results.

**R-AI-02**: If `decideAiEmployeeAction` returns `kind: 'escalate'`, execution stops immediately and an escalation event is published. No tool is called.

**R-AI-03**: AI agents use `memory_records` scoped to `(owner_type='agent', owner_id=employeeKey)`. An agent cannot read another agent's memory.

**R-AI-04**: Inference via Claude API is optional. If `ANTHROPIC_API_KEY` is absent, the raw decision input is used. This enables non-AI test environments.

**R-AI-05**: The canonical AI model is `claude-sonnet-4-6`. Changing this requires architecture review — never change in feature code.

---

## Audit Rules

**R-AUD-01**: Every mutation to a business entity emits a domain event before the mutation is committed.

**R-AUD-02**: The `event_log` and `identity_audit_events` tables are append-only. No updates or deletes are ever permitted.

**R-AUD-03**: Provider credential access (even failed lookups) is logged to `provider_credential_audit`.

**R-AUD-04**: All authentication events (login, logout, token refresh, MFA) are logged to `identity_audit_events`.

**R-AUD-05**: Soft deletes only. Hard deletes are never used on business data tables. The `deleted_at` field marks inactive records.
