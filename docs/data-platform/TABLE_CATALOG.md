# BOSS Table Catalog

> Version: 1.0.0 | 82 tables | All columns, types, constraints, and indexes

---

## Identity OS (Migration 0021)

### organizations
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| plan | text | NOT NULL, DEFAULT 'trial' |
| status | text | NOT NULL, CHECK (active\|trial\|suspended) |
| created_by | text | NOT NULL |
| created_at | timestamptz | NOT NULL, DEFAULT now() |
| updated_at | timestamptz | NOT NULL, DEFAULT now() |
| deleted_at | timestamptz | |

RLS: `organizations_member_select` — member SELECT only.

### organization_memberships
| Column | Type | Constraints |
|--------|------|-------------|
| organization_id | uuid | PK part, FK → organizations |
| user_id | text | PK part |
| role | text | NOT NULL, CHECK (owner\|admin\|operator\|viewer) |
| status | text | NOT NULL, CHECK (active\|suspended) |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

Indexes: `idx_organization_memberships_user (user_id, status)`
RLS: `memberships_self_select`

### user_tenant_preferences
| Column | Type | Constraints |
|--------|------|-------------|
| user_id | text | PK |
| active_organization_id | uuid | FK → organizations |
| updated_at | timestamptz | NOT NULL |

RLS: `tenant_preferences_self_policy`

### identity_audit_events
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| tenant_id | text | NOT NULL |
| organization_id | uuid | FK → organizations |
| actor_id | text | NOT NULL |
| action | text | NOT NULL |
| resource_type | text | NOT NULL |
| resource_id | text | |
| outcome | text | NOT NULL, CHECK (success\|failure\|denied) |
| trace_id | text | NOT NULL |
| request_id | text | |
| correlation_id | text | |
| metadata | jsonb | NOT NULL, DEFAULT '{}' |
| occurred_at | timestamptz | NOT NULL |

Indexes: `idx_identity_audit_tenant_time`, `idx_identity_audit_actor_time`

---

## Business Intelligence OS (Migration 0001)

### businesses
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| name | text | NOT NULL |
| industry | text | NOT NULL |
| employee_count | integer | NOT NULL, DEFAULT 0 |
| annual_revenue | numeric | NOT NULL, DEFAULT 0 |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

### business_profiles
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses, UNIQUE |
| business_name | text | NOT NULL |
| business_type | text | NOT NULL |
| years_operating | integer | NOT NULL, DEFAULT 0 |
| employee_count | integer | NOT NULL, DEFAULT 0 |
| location_count | integer | NOT NULL, DEFAULT 1 |
| business_hours | text | NOT NULL, DEFAULT '' |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

### business_mri
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses |
| version | text | NOT NULL, DEFAULT '1.0.0' |
| status | text | NOT NULL, DEFAULT 'not_started', CHECK (not_started\|in_progress\|completed) |
| started_at | timestamptz | |
| completed_at | timestamptz | |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

### business_mri_questions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| question_key | text | NOT NULL, UNIQUE |
| section_key | text | NOT NULL |
| label | text | NOT NULL |
| question_type | text | NOT NULL, CHECK (text\|number\|boolean\|single_select\|multi_select\|scale) |
| options | jsonb | |
| required | boolean | NOT NULL, DEFAULT false |
| sort_order | integer | NOT NULL, DEFAULT 0 |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

### business_mri_responses
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_mri_id | uuid | NOT NULL, FK → business_mri |
| section_key | text | NOT NULL |
| question_key | text | NOT NULL, FK → business_mri_questions(question_key) |
| value | jsonb | NOT NULL |
| answered_at | timestamptz | NOT NULL, DEFAULT now() |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

UNIQUE: `(business_mri_id, question_key)`

### business_dna
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses, UNIQUE |
| archetype | text | NOT NULL |
| growth_stage | text | NOT NULL |
| operational_complexity | text | NOT NULL |
| technology_maturity | text | NOT NULL |
| automation_readiness | text | NOT NULL |
| customer_engagement_style | text | NOT NULL |
| revenue_model | text | NOT NULL |
| communication_style | text | NOT NULL |
| decision_style | text | NOT NULL |
| risk_profile | text | NOT NULL |
| generated_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

### business_health
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses, UNIQUE |
| overall_score | numeric | NOT NULL, DEFAULT 0 |
| generated_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

### business_health_dimensions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_health_id | uuid | NOT NULL, FK → business_health |
| dimension_key | text | NOT NULL |
| score | numeric | NOT NULL |
| confidence | numeric | NOT NULL |
| trend | text | NOT NULL, CHECK (improving\|stable\|declining\|unknown) |
| evidence | jsonb | NOT NULL, DEFAULT '[]' |
| status | text | NOT NULL, CHECK (strong\|healthy\|at_risk\|critical) |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

UNIQUE: `(business_health_id, dimension_key)`

### business_capabilities
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses |
| capability_key | text | NOT NULL |
| current_maturity | text | NOT NULL, CHECK (absent\|ad_hoc\|developing\|managed\|optimized) |
| business_importance | text | NOT NULL, CHECK (low\|medium\|high\|critical) |
| automation_potential | text | NOT NULL, CHECK (low\|medium\|high) |
| dependencies | jsonb | NOT NULL, DEFAULT '[]' |
| owner | text | NOT NULL, DEFAULT 'unassigned' |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

UNIQUE: `(business_id, capability_key)`

### business_timeline
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses |
| type | text | NOT NULL |
| description | text | NOT NULL |
| metadata | jsonb | NOT NULL, DEFAULT '{}' |
| occurred_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

Indexes: `idx_business_timeline_business_id`, `idx_business_timeline_occurred_at`

---

## Constraint Intelligence (Migration 0004)

### constraint_categories
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| category_key | text | NOT NULL, UNIQUE |
| label | text | NOT NULL |
| description | text | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### constraint_definitions
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| definition_key | text | NOT NULL, UNIQUE |
| title | text | NOT NULL |
| description | text | NOT NULL |
| category_key | text | NOT NULL, FK → constraint_categories |
| default_severity | text | NOT NULL, CHECK (critical\|high\|medium\|low\|informational) |
| automation_potential | text | NOT NULL, CHECK (low\|medium\|high) |
| business_owner | text | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### constraint_instances
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| business_id | uuid | NOT NULL, FK → businesses |
| definition_key | text | NOT NULL, FK → constraint_definitions |
| title | text | NOT NULL |
| description | text | NOT NULL |
| category_key | text | NOT NULL, FK → constraint_categories |
| severity | text | NOT NULL, CHECK (critical\|high\|medium\|low\|informational) |
| confidence | numeric | NOT NULL, DEFAULT 0 |
| business_impact | text | NOT NULL |
| revenue_loss_annual | numeric | NOT NULL, DEFAULT 0 |
| time_lost_hours_weekly | numeric | NOT NULL, DEFAULT 0 |
| customer_impact | text | NOT NULL, CHECK (low\|medium\|high) |
| operational_impact | text | NOT NULL, CHECK (low\|medium\|high) |
| growth_limitation | text | NOT NULL, CHECK (low\|medium\|high) |
| owner_stress | text | NOT NULL, CHECK (low\|medium\|high) |
| automation_potential | text | NOT NULL, CHECK (low\|medium\|high) |
| business_owner | text | NOT NULL |
| dependencies | jsonb | NOT NULL, DEFAULT '[]' |
| status | text | NOT NULL, DEFAULT 'active', CHECK (active\|monitoring\|resolved\|dismissed) |
| date_detected | timestamptz | NOT NULL |
| version | integer | NOT NULL, DEFAULT 1 |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |
| deleted_at | timestamptz | |

Indexes: `idx_constraint_instances_business`, `idx_constraint_instances_org`

### constraint_scores
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| constraint_instance_id | uuid | NOT NULL, FK → constraint_instances, UNIQUE |
| business_impact_score | numeric | NOT NULL |
| financial_impact_score | numeric | NOT NULL |
| customer_impact_score | numeric | NOT NULL |
| urgency_score | numeric | NOT NULL |
| automation_score | numeric | NOT NULL |
| confidence_score | numeric | NOT NULL |
| overall_score | numeric | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

### constraint_priorities
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| org_id | uuid | NOT NULL |
| constraint_instance_id | uuid | NOT NULL, FK → constraint_instances, UNIQUE |
| priority | text | NOT NULL, CHECK (critical\|high\|medium\|low\|informational) |
| rank | integer | NOT NULL |
| computed_at | timestamptz | NOT NULL |
| created_at | timestamptz | NOT NULL |
| updated_at | timestamptz | NOT NULL |

---

## Recommendation Intelligence (Migration 0006)

*(Full column specifications follow the same pattern as constraint_instances — see migration 0006 for complete DDL. Key columns summarized below.)*

### recommendation_instances — key columns
- `status`: proposed\|approved\|rejected\|in_progress\|completed\|dismissed
- `approval`: auto\|approval_required\|executive_review\|manual_only
- `stage`: quick_wins\|short_term\|medium_term\|strategic\|long_term
- `confidence`, `estimated_effort_hours`, `estimated_cost`, `estimated_time_to_value_days`

### recommendation_roi_estimates — key columns
- `revenue_increase_annual`, `time_saved_hours_weekly`, `profit_impact_annual`
- `risk_reduction`: low\|medium\|high

---

## Decision & Scenario (Migrations 0015–0016)

### business_decisions — key columns
| Column | Type |
|--------|------|
| decision_type | text |
| objective | text |
| options | jsonb |
| selected_option_key | text |
| confidence_score | numeric |
| expected_roi, expected_cost | numeric |
| actual_roi | numeric (post-measurement) |
| status | draft\|generated\|reviewed\|approved\|rejected\|scheduled\|executing\|completed\|measured\|archived |
| generated_workflow_id | text |

### business_scenarios — key columns
| Column | Type |
|--------|------|
| scenario_type | text |
| projected_revenue, projected_cost, projected_profit | numeric |
| risk_level | text |
| forecast_period | text DEFAULT '90d' |
| status | draft\|calculated\|approved\|rejected\|archived |

---

## Loop Runtime (Migrations 0010, 0018)

### runtime_jobs — key columns
| Column | Type | Constraints |
|--------|------|-------------|
| queue_name | text | NOT NULL |
| idempotency_key | text | UNIQUE per (org_id, queue_name) |
| state | text | pending\|running\|completed\|dead_letter |
| attempts | integer | NOT NULL, DEFAULT 0, CHECK >= 0 |
| maximum_attempts | integer | NOT NULL, DEFAULT 3 |
| available_at | timestamptz | NOT NULL |
| lease_owner | text | |
| lease_expires_at | timestamptz | |

Indexes: `uq_runtime_jobs_idempotency`, `idx_runtime_jobs_claim (queue_name, state, available_at, lease_expires_at)`

### scheduler_jobs — key columns
| Column | Type | Constraints |
|--------|------|-------------|
| workflow_key | text | NOT NULL |
| trigger_type | text | immediate\|delayed\|cron\|recurring |
| cron_expression | text | |
| timezone | text | DEFAULT 'UTC' |
| run_at | timestamptz | NOT NULL |
| state | text | pending\|running\|completed\|failed\|cancelled |
| max_runs | integer | null=unlimited |

---

## Customer & Sales OS (Migrations 0025–0030, 0034)

### customers — key columns
| Column | Type |
|--------|------|
| first_name, last_name | text |
| email, phone, address | text (nullable) |
| status | text DEFAULT 'prospect' |
| tags | text[] NOT NULL DEFAULT '{}' |
| total_revenue | numeric(14,2) |
| health_score | numeric(5,2) |
| last_contact_at | timestamptz |

### invoices — key columns
| Column | Type |
|--------|------|
| invoice_number | text UNIQUE per org |
| status | draft\|sent\|viewed\|paid\|overdue\|cancelled\|refunded |
| line_items | jsonb NOT NULL DEFAULT '[]' |
| subtotal_cents, tax_cents, discount_cents, total_cents | integer |
| currency | text DEFAULT 'USD' |

### payments — key columns
| Column | Type | Constraints |
|--------|------|-------------|
| amount_cents | integer | CHECK > 0 |
| method | text | cash\|card\|bank_transfer\|check\|other |
| status | text | pending\|completed\|failed\|refunded |

### leads — key columns
| Column | Type |
|--------|------|
| status | new\|contacted\|qualified\|converted\|lost |
| source | text DEFAULT 'manual' |
| estimated_value | numeric(12,2) |
| converted_customer_id | uuid |
| tags | text[] NOT NULL DEFAULT '{}' |

---

## Integration & Tool OS (Migration 0008)

### tool_executions — key columns
| Column | Type |
|--------|------|
| status | pending\|succeeded\|failed\|rejected |
| input, output | jsonb |
| attempt_count | integer DEFAULT 1 (added 0012) |
| latency_ms | numeric (added 0012) |

### provider_credentials (Migration 0032)
| Column | Type | Constraints |
|--------|------|-------------|
| org_id | uuid | NOT NULL |
| secret_key | text | NOT NULL |
| ciphertext, iv, auth_tag | text | NOT NULL |
| UNIQUE | | (org_id, secret_key) |

### provider_credential_audit (Migration 0032)
| Column | Type | Constraints |
|--------|------|-------------|
| action | text | NOT NULL, CHECK (get\|put\|rotate\|delete) |
| actor | text | NOT NULL |
| occurred_at | timestamptz | NOT NULL |

---

## Platform Infrastructure

### notification_deliveries (Migration 0031)
| Column | Type | Constraints |
|--------|------|-------------|
| channel | text | NOT NULL, CHECK (sms\|email\|slack\|teams\|push\|voice\|internal) |
| recipient | text | NOT NULL |
| status | text | pending\|sent\|delivered\|failed |
| attempt_count | int | NOT NULL DEFAULT 0 |

### feature_flags (Migration 0033)
| Column | Type | Constraints |
|--------|------|-------------|
| org_id | uuid | nullable (null = global) |
| flag_key | text | NOT NULL |
| enabled | boolean | NOT NULL DEFAULT false |
| UNIQUE | | (org_id, flag_key) |

---

## Helper Functions

```sql
-- Read current org from JWT or session setting
boss_current_org_id() RETURNS uuid

-- Read current user from JWT or session setting
boss_current_user_id() RETURNS text
```

Both functions are `STABLE` and used by all RLS policies.
