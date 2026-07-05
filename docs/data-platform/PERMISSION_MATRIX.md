# BOSS Permission Matrix

> Version: 1.0.0 | Role × Resource × Operation

---

## Roles

| Role | Description | Scope |
|------|-------------|-------|
| `platform_admin` | Anthropic/BOSS internal admin | All orgs |
| `owner` | Organization owner | Own org |
| `admin` | Organization administrator | Own org |
| `operator` | Day-to-day operator/manager | Own org |
| `viewer` | Read-only access | Own org |
| `finance` | Finance-specific access | Own org |
| `sales` | Sales/CRM access | Own org |
| `staff` | Frontline staff (jobs, appointments) | Own org |
| `ai_agent` | Internal AI employee actors | Own org |
| `integration` | Service-to-service integration access | Own org |

---

## Core Permissions Matrix

Legend: ✅ Full access | 🔶 Own records only | 📖 Read only | ❌ No access | 🔑 Requires approval

### Identity

| Resource | platform_admin | owner | admin | operator | viewer |
|---------|:-:|:-:|:-:|:-:|:-:|
| organizations (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| organizations (write) | ✅ | ✅ | ❌ | ❌ | ❌ |
| organization_memberships (read) | ✅ | ✅ | ✅ | 🔶 | 🔶 |
| organization_memberships (write) | ✅ | ✅ | ✅ | ❌ | ❌ |
| feature_flags (read) | ✅ | ✅ | ✅ | 📖 | 📖 |
| feature_flags (write) | ✅ | ✅ | ❌ | ❌ | ❌ |

### Business Intelligence

| Resource | owner | admin | operator | viewer | ai_agent |
|---------|:-:|:-:|:-:|:-:|:-:|
| businesses (CRUD) | ✅ | ✅ | ❌ | 📖 | 📖 |
| business_profiles (CRUD) | ✅ | ✅ | 📖 | 📖 | 📖 |
| business_mri (start) | ✅ | ✅ | ✅ | ❌ | ❌ |
| business_mri (respond) | ✅ | ✅ | ✅ | ❌ | ❌ |
| business_dna (read) | ✅ | ✅ | 📖 | 📖 | ✅ |
| business_health (read) | ✅ | ✅ | ✅ | 📖 | ✅ |
| business_capabilities (read) | ✅ | ✅ | ✅ | 📖 | ✅ |
| business_timeline (read) | ✅ | ✅ | ✅ | 📖 | 📖 |

### Constraint & Recommendation Intelligence

| Resource | owner | admin | operator | viewer | ai_agent |
|---------|:-:|:-:|:-:|:-:|:-:|
| constraint_instances (read) | ✅ | ✅ | 📖 | 📖 | ✅ |
| constraint_instances (status update) | ✅ | ✅ | ✅ | ❌ | 🔑 |
| recommendation_instances (read) | ✅ | ✅ | 📖 | 📖 | ✅ |
| recommendation_instances (approve) | ✅ | ✅ | 🔑 | ❌ | ❌ |
| recommendation_instances (dismiss) | ✅ | ✅ | ✅ | ❌ | ❌ |
| transformation_roadmaps (read) | ✅ | ✅ | ✅ | 📖 | �� |

### Decision & Scenario

| Resource | owner | admin | operator | viewer | ai_agent |
|---------|:-:|:-:|:-:|:-:|:-:|
| business_decisions (read) | ✅ | ✅ | ��� | 📖 | ✅ |
| business_decisions (approve/reject) | ✅ | ✅ | 🔑 | ❌ | ❌ |
| business_decisions (generate) | ✅ | ✅ | ❌ | ❌ | ✅ |
| business_scenarios (read) | ✅ | ✅ | ✅ | 📖 | ✅ |
| business_scenarios (create) | ✅ | ✅ | ❌ | ❌ | ✅ |

### Customer & Sales OS

| Resource | owner | admin | sales | staff | finance | viewer | ai_agent |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| customers (CRUD) | ✅ | ✅ | ✅ | 📖 | 📖 | 📖 | ✅ |
| customer_interactions (CRUD) | ✅ | ✅ | ✅ | 🔶 | ❌ | 📖 | ✅ |
| leads (CRUD) | ✅ | ✅ | ✅ | ❌ | ❌ | 📖 | ✅ |
| leads (qualify/convert) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🔑 |
| jobs (CRUD) | ✅ | ✅ | ✅ | ✅ | 📖 | 📖 | ✅ |
| appointments (CRUD) | ✅ | ✅ | ✅ | ✅ | ❌ | 📖 | ✅ |
| invoices (read) | ✅ | ✅ | ✅ | ❌ | ✅ | 📖 | ✅ |
| invoices (create/send) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | 🔑 |
| payments (read) | ✅ | ✅ | ❌ | ❌ | ✅ | 📖 | 📖 |
| payments (record) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ��� |
| customer_reviews (read) | ✅ | ✅ | ✅ | ✅ | ❌ | 📖 | ✅ |
| customer_reviews (respond) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 🔑 |

### KPI, Goals & Briefings

| Resource | owner | admin | operator | viewer | ai_agent |
|---------|:-:|:-:|:-:|:-:|:-:|
| kpi_readings (read) | ✅ | ✅ | ✅ | 📖 | ✅ |
| kpi_readings (write) | ✅ | ✅ | ✅ | ❌ | ✅ |
| business_goals (CRUD) | ✅ | ✅ | ✅ | 📖 | ✅ |
| executive_briefings (read) | ✅ | ✅ | 📖 | ❌ | ✅ |
| executive_briefings (generate) | ✅ | ✅ | ❌ | ❌ | ✅ |

### Integration & Tool OS

| Resource | owner | admin | operator | viewer | ai_agent | integration |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|
| integration_accounts (read) | ✅ | ✅ | 📖 | 📖 | 📖 | ��� |
| integration_accounts (connect/disconnect) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| tool_executions (read own) | ✅ | ✅ | 📖 | ❌ | ❌ | ✅ |
| tool_executions (invoke) | ✅ | ✅ | 🔑 | ❌ | ❌ | ✅ |
| permission_policies (read) | ✅ | ✅ | 📖 | ❌ | ❌ | ❌ |
| permission_policies (write) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| provider_credentials (read — decrypted) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| provider_credentials (write) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> Decrypted credential values are never returned to any API consumer. The secret vault is read only by server-side tool execution infrastructure.

### Workflow & Loop OS

| Resource | owner | admin | operator | viewer | ai_agent |
|---------|:-:|:-:|:-:|:-:|:-:|
| workflow_executions (read) | ✅ | ✅ | ✅ | ���� | ✅ |
| workflow_executions (dispatch) | ✅ | ✅ | 🔑 | ❌ | ✅ |
| workflow_executions (approve gate) | ✅ | ✅ | 🔑 | ❌ | ❌ |
| scheduler_jobs (read) | ✅ | ✅ | ✅ | 📖 | 📖 |
| scheduler_jobs (create/cancel) | ✅ | ✅ | 🔑 | ❌ | ✅ |
| memory_records (read own agent) | ❌ | ❌ | ❌ | ❌ | ✅ |
| memory_records (write own agent) | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## Tool-Level Approval Matrix

Mapped to `permission_policies.approval` values:

| Tool Category | Default Approval | Override |
|--------------|-----------------|---------|
| Read-only data retrieval | `auto` | Per org |
| Customer communications (SMS, email) | `approval_required` | Per org |
| Financial operations (invoice, payment) | `executive_review` | Per org |
| Integration writes (CRM, calendar) | `approval_required` | Per org |
| Bulk operations | `executive_review` | Per org |
| External API mutations | `approval_required` | Per org |
| Credential rotation | `executive_review` | Fixed |

---

## AI Agent Permission Constraints

AI agents (`ai_agent` role) are subject to additional constraints:

1. **No credential access**: Agents may never read raw credential values
2. **Tool-level permission check**: Every tool invocation checks `permission_policies` before execution
3. **Approval gates**: `approval_required` and `executive_review` tools generate approval requests before executing
4. **Memory isolation**: Each agent's `memory_records` are scoped to `(owner_type='agent', owner_id=employeeKey)`
5. **Escalation**: If `decideAiEmployeeAction` returns `kind: "escalate"`, execution stops and an escalation event is published

---

## Custom Role Support

The schema supports custom roles for future implementation:

- `permission_policies.role_key` is a free-text field — any string is valid
- Future: A `custom_roles` table can define role metadata and inheritance
- Present: Only the roles defined above are actively checked by application code
