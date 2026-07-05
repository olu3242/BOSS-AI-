# BOSS Validation Rules

> Version: 1.0.0 | API boundary validation, database constraints, and business rules

---

## Validation Layers

```
1. API boundary (Zod schema) — first line of defense
2. Service layer — business rule validation
3. Database CHECK constraints — final guarantee
4. RLS policies — tenant isolation (orthogonal to validation)
```

---

## Universal Validation Rules

Applied to every create/update operation:

| Rule | Enforcement |
|------|-------------|
| `org_id` must come from JWT, never from body | API middleware |
| `id` must never be set by client | API schema rejects it |
| `created_at`, `updated_at` must never be set by client | API schema rejects them |
| `deleted_at` set only via soft-delete endpoint | No direct field update |

---

## Identity Validation

### organizations

| Field | Rule | Error Code |
|-------|------|-----------|
| `name` | 1–200 chars | `ORG_NAME_INVALID` |
| `slug` | 3–50 chars; `/^[a-z0-9-]+$/`; unique globally | `ORG_SLUG_INVALID` / `ORG_SLUG_TAKEN` |
| `plan` | One of: `trial\|starter\|growth\|enterprise` | `ORG_PLAN_INVALID` |
| `status` | One of: `active\|trial\|suspended` | `ORG_STATUS_INVALID` |
| `slug` (update) | Immutable after creation | `ORG_SLUG_IMMUTABLE` |

### organization_memberships

| Field | Rule | Error Code |
|-------|------|-----------|
| `user_id` | Non-empty string | `MEMBERSHIP_USER_INVALID` |
| `role` | One of: `owner\|admin\|operator\|viewer` | `MEMBERSHIP_ROLE_INVALID` |
| `status` | One of: `active\|suspended` | `MEMBERSHIP_STATUS_INVALID` |
| Uniqueness | `(org_id, user_id)` unique | `MEMBERSHIP_DUPLICATE` |

---

## Business Validation

### businesses

| Field | Rule | Error Code |
|-------|------|-----------|
| `name` | 1–200 chars | `BUSINESS_NAME_INVALID` |
| `industry` | Must exist in industry pack registry | `BUSINESS_INDUSTRY_UNKNOWN` |
| `employee_count` | >= 0 integer | `BUSINESS_EMPLOYEE_COUNT_INVALID` |
| `annual_revenue` | >= 0 | `BUSINESS_REVENUE_INVALID` |
| `industry` (update) | Immutable after creation | `BUSINESS_INDUSTRY_IMMUTABLE` |

### business_profiles

| Field | Rule | Error Code |
|-------|------|-----------|
| `business_name` | 1–200 chars | `PROFILE_NAME_INVALID` |
| `business_type` | Non-empty | `PROFILE_TYPE_INVALID` |
| `years_operating` | >= 0 integer | `PROFILE_YEARS_INVALID` |
| `location_count` | >= 1 integer | `PROFILE_LOCATIONS_INVALID` |
| `business_hours` | Max 500 chars | `PROFILE_HOURS_INVALID` |

### business_dna

| Field | Rule | Error Code |
|-------|------|-----------|
| `growth_stage` | One of: `startup\|growing\|scaling\|mature\|declining` | `DNA_GROWTH_STAGE_INVALID` |
| `operational_complexity` | One of: `simple\|moderate\|complex\|enterprise` | `DNA_COMPLEXITY_INVALID` |
| `technology_maturity` | One of: `analog\|basic\|intermediate\|advanced\|cutting_edge` | `DNA_TECH_MATURITY_INVALID` |
| `automation_readiness` | One of: `not_ready\|exploring\|ready\|implementing\|optimizing` | `DNA_AUTOMATION_INVALID` |
| `risk_profile` | One of: `conservative\|moderate\|aggressive` | `DNA_RISK_INVALID` |

---

## MRI Validation

### business_mri_questions

| Field | Rule | Error Code |
|-------|------|-----------|
| `question_key` | `/^[a-z0-9-]+$/`; unique per org | `MRI_QUESTION_KEY_INVALID` |
| `question_type` | One of: `text\|number\|boolean\|single_select\|multi_select\|scale` | `MRI_QUESTION_TYPE_INVALID` |
| `options` | Required when type is `single_select` or `multi_select`; array of `{value, label}` | `MRI_OPTIONS_REQUIRED` |
| `sort_order` | >= 0 integer | `MRI_SORT_ORDER_INVALID` |

### business_mri_responses

| Field | Rule | Error Code |
|-------|------|-----------|
| `value` | Required; type matches question_type | `MRI_RESPONSE_TYPE_MISMATCH` |
| Number response | Must be a finite number | `MRI_RESPONSE_NOT_NUMBER` |
| Boolean response | Must be true or false | `MRI_RESPONSE_NOT_BOOLEAN` |
| Single select | Value must be in question options | `MRI_RESPONSE_OPTION_INVALID` |
| Multi select | All values must be in question options | `MRI_RESPONSE_OPTION_INVALID` |
| Scale | Integer 1–10 | `MRI_RESPONSE_SCALE_INVALID` |

---

## Constraint Validation

### constraint_instances

| Field | Rule | Error Code |
|-------|------|-----------|
| `title` | 1–300 chars | `CONSTRAINT_TITLE_INVALID` |
| `description` | Non-empty | `CONSTRAINT_DESC_INVALID` |
| `severity` | One of: `critical\|high\|medium\|low\|informational` | `CONSTRAINT_SEVERITY_INVALID` |
| `confidence` | 0–1 numeric | `CONSTRAINT_CONFIDENCE_INVALID` |
| `revenue_loss_annual` | >= 0 | `CONSTRAINT_REVENUE_INVALID` |
| `time_lost_hours_weekly` | >= 0 | `CONSTRAINT_TIME_INVALID` |
| `customer_impact` | One of: `low\|medium\|high` | `CONSTRAINT_IMPACT_INVALID` |
| `automation_potential` | One of: `low\|medium\|high` | `CONSTRAINT_AUTOMATION_INVALID` |
| `status` | One of: `active\|monitoring\|resolved\|dismissed` | `CONSTRAINT_STATUS_INVALID` |

---

## Recommendation Validation

### recommendation_instances

| Field | Rule | Error Code |
|-------|------|-----------|
| `title` | 1–300 chars | `REC_TITLE_INVALID` |
| `business_goal` | Non-empty | `REC_GOAL_INVALID` |
| `expected_outcome` | Max 1000 chars | `REC_OUTCOME_TOO_LONG` |
| `difficulty` | One of: `low\|medium\|high` | `REC_DIFFICULTY_INVALID` |
| `estimated_effort_hours` | >= 0 | `REC_EFFORT_INVALID` |
| `estimated_cost` | >= 0 | `REC_COST_INVALID` |
| `estimated_time_to_value_days` | >= 0 | `REC_TTV_INVALID` |
| `confidence` | 0–1 | `REC_CONFIDENCE_INVALID` |
| `approval` | One of: `auto\|approval_required\|executive_review\|manual_only` | `REC_APPROVAL_INVALID` |
| `stage` | One of: `quick_wins\|short_term\|medium_term\|strategic\|long_term` | `REC_STAGE_INVALID` |
| `status` | One of: `proposed\|approved\|rejected\|in_progress\|completed\|dismissed` | `REC_STATUS_INVALID` |

---

## Customer & Sales Validation

### customers

| Field | Rule | Error Code |
|-------|------|-----------|
| `first_name` | 1–100 chars | `CUSTOMER_FIRST_NAME_INVALID` |
| `last_name` | 0–100 chars | `CUSTOMER_LAST_NAME_INVALID` |
| `email` | RFC 5322 format or NULL | `CUSTOMER_EMAIL_INVALID` |
| `phone` | E.164 or free-text; optional | — |
| `address` | Max 500 chars | `CUSTOMER_ADDRESS_TOO_LONG` |
| `total_revenue` | Never set directly (computed) | `FIELD_READONLY` |
| `health_score` | Never set directly (AI-computed) | `FIELD_READONLY` |

### leads

| Field | Rule | Error Code |
|-------|------|-----------|
| `first_name` | 1–100 chars | `LEAD_FIRST_NAME_INVALID` |
| `email` | RFC 5322 or NULL | `LEAD_EMAIL_INVALID` |
| `source` | Non-empty | `LEAD_SOURCE_REQUIRED` |
| `status` | One of: `new\|contacted\|qualified\|converted\|lost` | `LEAD_STATUS_INVALID` |
| `estimated_value` | >= 0 or NULL | `LEAD_VALUE_INVALID` |
| `converted_customer_id` | Only set via convert endpoint | `LEAD_CONVERT_DIRECT_FORBIDDEN` |

### invoices

| Field | Rule | Error Code |
|-------|------|-----------|
| `invoice_number` | Non-empty; unique per org | `INVOICE_NUMBER_TAKEN` |
| `line_items` | Non-empty array of `{description, quantity, unit_price_cents, total_cents}` | `INVOICE_LINE_ITEMS_INVALID` |
| `quantity` | > 0 | `INVOICE_QTY_INVALID` |
| `unit_price_cents` | >= 0 | `INVOICE_PRICE_INVALID` |
| `total_cents` | Must equal `subtotal + tax - discount` | `INVOICE_TOTAL_MISMATCH` |
| `currency` | ISO 4217 | `INVOICE_CURRENCY_INVALID` |

### payments

| Field | Rule | Error Code |
|-------|------|-----------|
| `amount_cents` | > 0 | `PAYMENT_AMOUNT_INVALID` |
| `currency` | ISO 4217 | `PAYMENT_CURRENCY_INVALID` |
| `method` | One of: `cash\|card\|bank_transfer\|check\|other` | `PAYMENT_METHOD_INVALID` |
| `status` | One of: `pending\|completed\|failed\|refunded` | `PAYMENT_STATUS_INVALID` |

### appointments

| Field | Rule | Error Code |
|-------|------|-----------|
| `title` | 1–200 chars | `APPT_TITLE_INVALID` |
| `start_at` | Must be < `end_at` | `APPT_TIME_RANGE_INVALID` |
| `end_at` | Must be > `start_at` | `APPT_TIME_RANGE_INVALID` |
| `status` | One of: `scheduled\|confirmed\|in_progress\|completed\|cancelled\|no_show` | `APPT_STATUS_INVALID` |

---

## Scheduler Validation

### scheduler_jobs

| Field | Rule | Error Code |
|-------|------|-----------|
| `workflow_key` | Non-empty | `SCHEDULER_WORKFLOW_KEY_REQUIRED` |
| `trigger_type` | One of: `immediate\|delayed\|cron\|recurring` | `SCHEDULER_TRIGGER_INVALID` |
| `cron_expression` | Required when trigger_type is `cron` or `recurring`; valid POSIX cron | `SCHEDULER_CRON_INVALID` |
| `timezone` | Valid IANA timezone | `SCHEDULER_TZ_INVALID` |
| `run_at` | Required for `delayed`; ISO 8601 timestamp | `SCHEDULER_RUN_AT_REQUIRED` |
| `max_runs` | >= 1 or NULL | `SCHEDULER_MAX_RUNS_INVALID` |

---

## Decision Validation

### business_decisions

| Field | Rule | Error Code |
|-------|------|-----------|
| `objective` | 1–1000 chars | `DECISION_OBJECTIVE_INVALID` |
| `options` | Array of `{key, label, description, pros[], cons[]}`; min 2 options | `DECISION_OPTIONS_INVALID` |
| `selected_option_key` | Must match a key in `options` array | `DECISION_OPTION_KEY_MISMATCH` |
| `confidence_score` | 0–1 | `DECISION_CONFIDENCE_INVALID` |

---

## Computed Field Protection

The following fields are rejected if included in any create/update request body:

- `customers.total_revenue`
- `customers.health_score`
- `business_health.overall_score`
- `constraint_scores.overall_score`
- `recommendation_scores.overall_score`
- `constraint_priorities.rank`
- `recommendation_priorities.rank`
- `business_decisions.actual_roi` (except via `/measure` endpoint)
