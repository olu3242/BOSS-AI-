# BOSS Indexing Strategy

> Version: 1.0.0 | Performance, capacity planning, and query optimization

---

## Existing Indexes (as of Migration 0034)

### Business Intelligence

```sql
-- businesses (high read frequency — queried on every request)
-- No additional indexes; primary key index on id is sufficient for single-business lookups
-- Recommended addition:
CREATE INDEX idx_businesses_org ON businesses(org_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_businesses_industry ON businesses(industry) WHERE deleted_at IS NULL;

-- business_profiles
CREATE INDEX idx_business_profiles_business_id ON business_profiles(business_id);

-- business_mri
CREATE INDEX idx_business_mri_business_id ON business_mri(business_id);

-- business_mri_sections
CREATE INDEX idx_business_mri_sections_mri_id ON business_mri_sections(business_mri_id);

-- business_mri_responses
CREATE INDEX idx_business_mri_responses_mri_id ON business_mri_responses(business_mri_id);

-- business_dna / health / capabilities / timeline
CREATE INDEX idx_business_dna_business_id ON business_dna(business_id);
CREATE INDEX idx_business_health_business_id ON business_health(business_id);
CREATE INDEX idx_business_health_dimensions_health_id ON business_health_dimensions(business_health_id);
CREATE INDEX idx_business_capabilities_business_id ON business_capabilities(business_id);
CREATE INDEX idx_business_timeline_business_id ON business_timeline(business_id);
CREATE INDEX idx_business_timeline_occurred_at ON business_timeline(occurred_at);
```

### Constraint Intelligence

```sql
CREATE INDEX idx_constraint_instances_business ON constraint_instances(business_id);
CREATE INDEX idx_constraint_instances_org ON constraint_instances(org_id);
CREATE INDEX idx_constraint_evidence_instance ON constraint_evidence(constraint_instance_id);
CREATE INDEX idx_constraint_relationships_instance ON constraint_relationships(constraint_instance_id);
CREATE INDEX idx_constraint_history_instance ON constraint_history(constraint_instance_id);
```

### Recommendation Intelligence

```sql
CREATE INDEX idx_recommendation_instances_business ON recommendation_instances(business_id);
CREATE INDEX idx_recommendation_instances_org ON recommendation_instances(org_id);
CREATE INDEX idx_recommendation_constraint_links_recommendation ON recommendation_constraint_links(recommendation_instance_id);
CREATE INDEX idx_recommendation_evidence_instance ON recommendation_evidence(recommendation_instance_id);
CREATE INDEX idx_transformation_roadmaps_business ON transformation_roadmaps(business_id);
CREATE INDEX idx_transformation_roadmap_stages_roadmap ON transformation_roadmap_stages(transformation_roadmap_id);
CREATE INDEX idx_recommendation_history_instance ON recommendation_history(recommendation_instance_id);
```

### Tool & Integration

```sql
CREATE INDEX idx_integration_accounts_business ON integration_accounts(business_id);
CREATE INDEX idx_integration_accounts_org ON integration_accounts(org_id);
CREATE INDEX idx_credential_references_account ON credential_references(integration_account_id);
CREATE INDEX idx_permission_policies_business ON permission_policies(business_id);
CREATE INDEX idx_tool_executions_business ON tool_executions(business_id);
CREATE INDEX idx_tool_executions_org ON tool_executions(org_id);
CREATE INDEX idx_provider_health_business ON provider_health(business_id);
CREATE INDEX idx_tool_audit_history_execution ON tool_audit_history(tool_execution_id);
CREATE INDEX idx_tool_audit_history_business ON tool_audit_history(business_id);
CREATE INDEX idx_provider_evidence_org_business ON provider_evidence(org_id, business_id);
CREATE INDEX idx_provider_evidence_tool_execution ON provider_evidence(tool_execution_id);
```

### Loop Runtime

```sql
-- Workflow executions
CREATE INDEX idx_workflow_executions_business ON workflow_executions(business_id);
CREATE INDEX idx_workflow_executions_org ON workflow_executions(org_id);
CREATE INDEX idx_workflow_executions_org_updated ON workflow_executions(org_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- Task executions
CREATE INDEX idx_task_executions_workflow ON task_executions(workflow_execution_id);
CREATE INDEX idx_task_executions_business ON task_executions(business_id);

-- Execution events
CREATE INDEX idx_execution_events_workflow ON execution_events(workflow_execution_id);
CREATE INDEX idx_execution_events_business ON execution_events(business_id);

-- Dead letters
CREATE INDEX idx_dead_letter_queue_business ON dead_letter_queue(business_id);
CREATE INDEX idx_dead_letter_queue_workflow ON dead_letter_queue(workflow_execution_id);

-- Runtime jobs (critical — used by worker claim loop)
CREATE UNIQUE INDEX uq_runtime_jobs_idempotency
  ON runtime_jobs(org_id, queue_name, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_runtime_jobs_claim
  ON runtime_jobs(queue_name, state, available_at, lease_expires_at)
  WHERE deleted_at IS NULL;

-- Scheduler jobs
CREATE INDEX idx_scheduler_jobs_org ON scheduler_jobs(org_id);
CREATE INDEX idx_scheduler_jobs_business ON scheduler_jobs(business_id);
CREATE INDEX idx_scheduler_jobs_pending
  ON scheduler_jobs(state, run_at) WHERE state = 'pending' AND deleted_at IS NULL;

-- Runtime schedules
CREATE INDEX idx_runtime_schedules_due
  ON runtime_schedules(status, run_at, lease_expires_at)
  WHERE deleted_at IS NULL;

-- Memory records
CREATE INDEX idx_memory_records_owner ON memory_records(org_id, business_id, owner_type, owner_id);

-- Agent executions
CREATE INDEX idx_agent_executions_org_updated ON agent_executions(org_id, updated_at DESC);

-- Checkpoints
CREATE INDEX idx_runtime_checkpoints_execution
  ON runtime_checkpoints(org_id, execution_type, execution_id);
```

### Event Log

```sql
CREATE INDEX idx_event_log_type ON event_log(type);
CREATE INDEX idx_event_log_occurred_at ON event_log(occurred_at DESC);
CREATE INDEX idx_event_log_org_id ON event_log(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_event_log_correlation ON event_log(correlation_id) WHERE correlation_id IS NOT NULL;
```

### Decisions & Scenarios

```sql
CREATE INDEX idx_business_decisions_business ON business_decisions(org_id, business_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_business_decisions_status ON business_decisions(status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_business_scenarios_business ON business_scenarios(org_id, business_id)
  WHERE deleted_at IS NULL;
```

### Discovery & Knowledge Graph

```sql
CREATE INDEX idx_business_discoveries_tenant ON business_discoveries(org_id, business_id);
CREATE INDEX idx_business_context_versions_discovery
  ON business_context_versions(org_id, discovery_id, version DESC);
CREATE INDEX idx_business_graph_nodes_type ON business_graph_nodes(org_id, graph_id, node_type);
CREATE INDEX idx_business_graph_edges_source ON business_graph_edges(org_id, graph_id, source_node_id);
CREATE INDEX idx_business_graph_edges_target ON business_graph_edges(org_id, graph_id, target_node_id);
```

### KPI & Goals

```sql
CREATE INDEX kpi_readings_business_measured ON kpi_readings(org_id, business_id, measured_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX kpi_readings_kpi_key ON kpi_readings(org_id, business_id, kpi_key, measured_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX business_goals_business ON business_goals(org_id, business_id, status)
  WHERE deleted_at IS NULL;
CREATE INDEX executive_briefings_business_generated
  ON executive_briefings(org_id, business_id, generated_at DESC)
  WHERE deleted_at IS NULL;
```

### Customer & Sales

```sql
CREATE INDEX idx_customers_org_business ON customers(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_org_status ON customers(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_email ON customers(org_id, email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE INDEX idx_customer_interactions_customer ON customer_interactions(org_id, customer_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_org_business ON leads(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_status ON leads(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_org_business ON jobs(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_status ON jobs(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_scheduled ON jobs(org_id, scheduled_at)
  WHERE deleted_at IS NULL AND scheduled_at IS NOT NULL;
CREATE INDEX idx_appointments_org_business ON appointments(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_start ON appointments(org_id, start_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_appointments_customer ON appointments(org_id, customer_id)
  WHERE deleted_at IS NULL AND customer_id IS NOT NULL;
CREATE UNIQUE INDEX uq_invoices_number ON invoices(org_id, invoice_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_org_business ON invoices(org_id, business_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_customer ON invoices(org_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_status ON invoices(org_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_org_invoice ON payments(org_id, invoice_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_org_customer ON payments(org_id, customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_status ON payments(org_id, status) WHERE deleted_at IS NULL;
```

---

## Missing Indexes — Recommendations

```sql
-- Full-text search on customers
CREATE INDEX idx_customers_fts ON customers
  USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(email,'')));

-- Full-text search on leads
CREATE INDEX idx_leads_fts ON leads
  USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || coalesce(email,'')));

-- businesses by org (very frequent — every request scoped by org)
CREATE INDEX idx_businesses_org ON businesses(org_id) WHERE deleted_at IS NULL;

-- Notification deliveries by channel+status for retry processing
CREATE INDEX idx_notification_deliveries_retry
  ON notification_deliveries(channel, status, created_at)
  WHERE status IN ('pending', 'failed') AND deleted_at IS NULL;

-- Provider credentials by key (read on every tool execution)
CREATE INDEX idx_provider_credentials_org_key ON provider_credentials(org_id, secret_key)
  WHERE deleted_at IS NULL;

-- Feature flags (read on many requests — should be cached)
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_feature_flags_org_key ON feature_flags(org_id, flag_key) WHERE deleted_at IS NULL;
```

---

## Partitioning Strategy

For tables expected to grow to billions of rows:

| Table | Partition Key | Strategy | Threshold |
|-------|--------------|---------|-----------|
| `event_log` | `occurred_at` | RANGE (monthly) | > 100M rows |
| `kpi_readings` | `measured_at` | RANGE (monthly) | > 50M rows |
| `tool_executions` | `started_at` | RANGE (monthly) | > 50M rows |
| `provider_evidence` | `created_at` | RANGE (monthly) | > 50M rows |
| `notification_deliveries` | `created_at` | RANGE (monthly) | > 50M rows |
| `mvp_journey_events` | `occurred_at` | RANGE (yearly) | > 10M rows |

---

## Materialized Views (Future)

| View | Source Tables | Refresh | Use Case |
|------|-------------|---------|---------|
| `mv_business_health_summary` | business_health + dimensions | Every 15m | Dashboard tiles |
| `mv_kpi_latest` | kpi_readings | Every 1h | Workspace KPI display |
| `mv_active_constraints` | constraint_instances + scores | Every 1h | Mission control |
| `mv_pending_approvals` | recommendation_instances + decisions | Real-time | Notification |
| `mv_revenue_by_month` | invoices + payments | Every 24h | Finance reports |

---

## Capacity Planning

Assumptions: 10,000 organizations, 3 businesses/org avg, 10 KPI readings/business/day:

| Table | 1 Year Rows | 3 Year Rows | Storage (est.) |
|-------|------------|------------|---------------|
| `event_log` | 500M | 1.5B | ~300 GB |
| `kpi_readings` | 110M | 330M | ~50 GB |
| `tool_executions` | 50M | 150M | ~30 GB |
| `notification_deliveries` | 100M | 300M | ~40 GB |
| `workflow_executions` | 20M | 60M | ~15 GB |
| `businesses` | 300K | 900K | <1 GB |
| `customers` | 10M | 30M | ~5 GB |
| `invoices` | 30M | 90M | ~20 GB |

Implement partitioning before hitting 50M rows per table to avoid downtime migrations.
