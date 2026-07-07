# BOSS Field Dictionary

> Version: 1.0.0 | Canonical field definitions across all entities

Every field in the platform is defined here with type, purpose, validation rules, and default behavior.

---

## Universal Fields (All Tables)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | uuid | YES | gen_random_uuid() | Never set by client |
| `org_id` | uuid | YES | — | Extracted from JWT; never from request body |
| `created_at` | timestamptz | YES | now() | Server-set; immutable |
| `updated_at` | timestamptz | YES | now() | Server-set; updated on every mutation |
| `deleted_at` | timestamptz | NO | NULL | NULL = active; soft delete only |

---

## Identity Fields

### organizations
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `name` | text | 1–200 chars | Display name |
| `slug` | text | 3–50 chars, lowercase alphanumeric + hyphens | URL-safe identifier; immutable after creation |
| `plan` | text | `trial\|starter\|growth\|enterprise` | Billing plan key |
| `status` | text | `active\|trial\|suspended` | DEFAULT trial |
| `created_by` | text | Non-empty | User ID who created the org |

### organization_memberships
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `user_id` | text | Non-empty | External auth user ID |
| `role` | text | `owner\|admin\|operator\|viewer` | Access role |
| `status` | text | `active\|suspended` | DEFAULT active |

---

## Business Fields

### businesses
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `name` | text | 1–200 chars | Business display name |
| `industry` | text | Non-empty; from industry pack registry | e.g. "dental", "restaurant" |
| `employee_count` | integer | >= 0 | DEFAULT 0 |
| `annual_revenue` | numeric | >= 0 | DEFAULT 0; USD |

### business_profiles
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `business_name` | text | 1–200 chars | May differ from businesses.name |
| `business_type` | text | Non-empty | e.g. "LLC", "Sole Proprietorship" |
| `years_operating` | integer | >= 0 | DEFAULT 0 |
| `location_count` | integer | >= 1 | DEFAULT 1 |
| `business_hours` | text | Max 500 chars | Free text |

### business_dna
| Field | Type | Enum Values | Notes |
|-------|------|------------|-------|
| `archetype` | text | any | AI-generated |
| `growth_stage` | text | `startup\|growing\|scaling\|mature\|declining` | AI-derived |
| `operational_complexity` | text | `simple\|moderate\|complex\|enterprise` | AI-derived |
| `technology_maturity` | text | `analog\|basic\|intermediate\|advanced\|cutting_edge` | AI-derived |
| `automation_readiness` | text | `not_ready\|exploring\|ready\|implementing\|optimizing` | AI-derived |
| `revenue_model` | text | any | AI-derived |
| `risk_profile` | text | `conservative\|moderate\|aggressive` | AI-derived |

---

## MRI Fields

### business_mri_questions
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `question_key` | text | UNIQUE; kebab-case | Registry key |
| `section_key` | text | Non-empty | e.g. "financials", "operations" |
| `question_type` | text | `text\|number\|boolean\|single_select\|multi_select\|scale` | Drives UI rendering |
| `options` | jsonb | Array of `{value, label}` objects | Required for select types |
| `required` | boolean | — | DEFAULT false |
| `sort_order` | integer | >= 0 | Within section |

### business_mri_responses
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `value` | jsonb | Required; type matches question_type | String, number, boolean, or array |
| `answered_at` | timestamptz | Non-null | Server-set |

---

## Constraint Fields

### constraint_instances
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | text | 1–300 chars | Display title |
| `description` | text | Non-empty | Detailed explanation |
| `severity` | text | `critical\|high\|medium\|low\|informational` | — |
| `confidence` | numeric | 0–1 | AI certainty score |
| `revenue_loss_annual` | numeric | >= 0 | Estimated USD |
| `time_lost_hours_weekly` | numeric | >= 0 | Estimated hours |
| `customer_impact` | text | `low\|medium\|high` | — |
| `automation_potential` | text | `low\|medium\|high` | — |
| `status` | text | `active\|monitoring\|resolved\|dismissed` | DEFAULT active |
| `version` | integer | >= 1 | Incremented on updates |

---

## Recommendation Fields

### recommendation_instances
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | text | 1–300 chars | — |
| `business_goal` | text | Non-empty | e.g. "Increase revenue by 20%" |
| `expected_outcome` | text | Max 1000 chars | — |
| `difficulty` | text | `low\|medium\|high` | — |
| `estimated_effort_hours` | numeric | >= 0 | — |
| `estimated_cost` | numeric | >= 0 | USD |
| `estimated_time_to_value_days` | numeric | >= 0 | — |
| `confidence` | numeric | 0–1 | AI score |
| `approval` | text | `auto\|approval_required\|executive_review\|manual_only` | — |
| `stage` | text | `quick_wins\|short_term\|medium_term\|strategic\|long_term` | — |
| `status` | text | `proposed\|approved\|rejected\|in_progress\|completed\|dismissed` | DEFAULT proposed |

---

## Decision Fields

### business_decisions
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `decision_type` | text | Non-empty | Category of decision |
| `objective` | text | 1–1000 chars | What the decision aims to achieve |
| `options` | jsonb | Array of `{key, label, description, pros, cons}` | AI-generated options |
| `selected_option_key` | text | Must match a key in options | Set on approval |
| `confidence_score` | numeric | 0–1 | — |
| `expected_roi` | numeric | Any | USD estimate |
| `actual_roi` | numeric | Any | Set post-measurement |
| `status` | text | See lifecycle | DEFAULT draft |

---

## Customer & Sales Fields

### customers
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `first_name` | text | 1–100 chars | — |
| `last_name` | text | 0–100 chars | DEFAULT '' |
| `email` | text | Valid email format or NULL | Indexed for lookup |
| `phone` | text | E.164 format preferred | Optional |
| `address` | text | Max 500 chars | Optional |
| `status` | text | Text field; recommended values: prospect\|active\|at_risk\|churned | DEFAULT 'prospect' |
| `source` | text | e.g. referral\|website\|advertisement | Optional |
| `tags` | text[] | Array of lowercase strings | DEFAULT '{}' |
| `total_revenue` | numeric(14,2) | >= 0 | Computed from payments |
| `health_score` | numeric(5,2) | 0–100 or NULL | AI-computed |

### leads
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `first_name` | text | 1–100 chars | — |
| `last_name` | text | 0–100 chars | DEFAULT '' |
| `email` | text | Valid email or NULL | — |
| `phone` | text | Optional | — |
| `source` | text | Non-empty | DEFAULT 'manual' |
| `status` | text | `new\|contacted\|qualified\|converted\|lost` | DEFAULT new |
| `assigned_to` | text | User ID or NULL | — |
| `estimated_value` | numeric(12,2) | >= 0 or NULL | — |
| `converted_customer_id` | uuid | FK → customers | Set on conversion |
| `qualified_at` | timestamptz | Server-set | Set when qualified |
| `converted_at` | timestamptz | Server-set | Set when converted |
| `tags` | text[] | Array | DEFAULT '{}' |

### jobs
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | text | 1–200 chars | — |
| `status` | text | `draft\|scheduled\|in_progress\|on_hold\|completed\|cancelled` | DEFAULT scheduled |
| `priority` | text | `low\|normal\|high\|urgent` | DEFAULT normal |
| `assigned_to` | text | User ID or NULL | — |
| `scheduled_at` | timestamptz | Optional | Future time |
| `estimated_duration_minutes` | integer | > 0 or NULL | — |
| `location` | text | Max 500 chars | Optional |
| `tags` | jsonb | Array of strings | DEFAULT '[]' |

### appointments
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `title` | text | 1–200 chars | — |
| `status` | text | `scheduled\|confirmed\|in_progress\|completed\|cancelled\|no_show` | DEFAULT scheduled |
| `start_at` | timestamptz | Required; < end_at | — |
| `end_at` | timestamptz | Required; > start_at | — |
| `assigned_to` | text | User ID or NULL | — |
| `reminder_sent` | boolean | — | DEFAULT false |

### invoices
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `invoice_number` | text | UNIQUE per org; typically "INV-NNNNNN" | — |
| `status` | text | `draft\|sent\|viewed\|paid\|overdue\|cancelled\|refunded` | DEFAULT draft |
| `line_items` | jsonb | Array of `{description, quantity, unit_price_cents, total_cents}` | — |
| `subtotal_cents` | integer | >= 0 | In cents (USD) |
| `tax_cents` | integer | >= 0 | — |
| `discount_cents` | integer | >= 0 | — |
| `total_cents` | integer | = subtotal + tax - discount | — |
| `currency` | text | ISO 4217 | DEFAULT 'USD' |
| `due_at` | timestamptz | Optional | — |

### payments
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `amount_cents` | integer | > 0 | CHECK constraint |
| `currency` | text | ISO 4217 | DEFAULT 'USD' |
| `method` | text | `cash\|card\|bank_transfer\|check\|other` | — |
| `status` | text | `pending\|completed\|failed\|refunded` | DEFAULT pending |
| `reference` | text | Optional | External payment reference |
| `paid_at` | timestamptz | Optional | Server-set on completion |

### customer_reviews
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `rating` | integer | 1–5 (CHECK) | — |
| `status` | text | `pending\|published\|flagged\|hidden` | DEFAULT pending |
| `source` | text | `internal\|google\|yelp\|facebook` | DEFAULT internal |
| `response` | text | Max 2000 chars | Business reply |
| `responded_at` | timestamptz | Server-set | Set when response written |

---

## Integration Fields

### tool_executions
| Field | Type | Notes |
|-------|------|-------|
| `requested_by` | text | User ID or agent key |
| `status` | text | `pending\|succeeded\|failed\|rejected` |
| `input` | jsonb | Sanitized before storage (no raw credentials) |
| `output` | jsonb | Provider response |
| `attempt_count` | integer | DEFAULT 1; incremented on retry |
| `latency_ms` | numeric | Measured execution time |

### provider_credentials
| Field | Type | Notes |
|-------|------|-------|
| `secret_key` | text | e.g. "twilio_api_key" |
| `ciphertext` | text | AES-256-GCM encrypted hex |
| `iv` | text | Random 16-byte IV (hex) |
| `auth_tag` | text | GCM authentication tag (hex) |
| `provider_key` | text | Optional association to provider_definitions |
| `rotated_at` | timestamptz | Last rotation timestamp |
| `expires_at` | timestamptz | Optional credential expiry |

---

## Scheduler Fields

### scheduler_jobs
| Field | Type | Notes |
|-------|------|-------|
| `workflow_key` | text | Target workflow to trigger |
| `trigger_type` | text | `immediate\|delayed\|cron\|recurring` |
| `cron_expression` | text | POSIX cron syntax; required for cron/recurring |
| `timezone` | text | IANA timezone; DEFAULT 'UTC' |
| `run_at` | timestamptz | Next (or only) scheduled fire time |
| `state` | text | `pending\|running\|completed\|failed\|cancelled` |
| `max_runs` | integer | NULL = unlimited; 1 = one-shot |
| `run_count` | integer | Total executions to date |
| `payload` | jsonb | Passed to workflow on execution |

---

## Computed / Derived Fields

The following fields are computed by application logic and must never be set directly by API clients:

| Table | Field | Derived From |
|-------|-------|-------------|
| `business_health` | `overall_score` | Average of dimension scores |
| `constraint_scores` | `overall_score` | Weighted average of sub-scores |
| `recommendation_scores` | `overall_score` | Weighted priority, value, implementation scores |
| `customers` | `total_revenue` | Sum of associated payments.amount_cents |
| `customers` | `health_score` | AI-computed from interaction history |
| `business_decisions` | `actual_roi` | Post-execution measurement |
| `constraint_priorities` | `rank` | Computed from overall_score ranking |
| `recommendation_priorities` | `rank` | Computed from overall_score ranking |

---

## Immutable Fields

Once set, these fields must never be updated:

| Table | Field | Reason |
|-------|-------|--------|
| Any | `id` | Primary key |
| Any | `created_at` | Audit trail |
| Any | `org_id` | Tenant isolation immutable |
| `organizations` | `slug` | External references depend on it |
| `businesses` | `industry` | Industry pack selection is permanent |
| `event_log` | All fields | Append-only log |
| `identity_audit_events` | All fields | Immutable audit trail |
| `provider_credential_audit` | All fields | Security audit |
| `business_mri_responses` | `question_key` | Answered question key is fixed |
