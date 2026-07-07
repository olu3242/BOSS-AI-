# BOSS AI Data Model

> Version: 1.0.0 | AI Employees, Memory, Inference, KPI Consumers, and Learning Loops

---

## Architecture Overview

```
Industry Pack Registry
  ├── aiEmployeeRegistry   (60+ AI employee definitions)
  ├── kpiRegistry          (100+ KPI definitions with formulas)
  ├── workflowRegistry     (workflow templates)
  └── capabilityRegistry   (business capability definitions)
          │
          ▼
MCP Intelligence Layer  ←── owns all intelligence
  ├── DiagnosticEngine     (health, root cause, gap analysis)
  ├── RecommendationEngine (ranked action generation)
  ��── DecisionEngine       (option generation, confidence scoring)
  ├── KpiDerivation        (formula evaluation → KpiReading)
  ├── runAiEmployeeInference (Claude API → enriched tool input)
  └── decideAiEmployeeAction (policy → tool request or escalate)
          │
          ▼
Loop Runtime  ←── owns all execution
  ├── WorkflowExecution    (orchestrates steps)
  ├── TaskExecution        (individual step state)
  ├── AgentExecution       (agent-level tracking)
  └── MemoryRecord         (agent runtime memory)
```

**Law 1 enforced**: MCP generates enriched reasoning → Loop executes → results stored as MemoryRecord.

---

## AI Employee Registry

### AiEmployeeEntry Interface

```typescript
interface AiEmployeeEntry {
  key: string;                    // unique identifier e.g. "smb_ceo"
  label: string;                  // display name e.g. "CEO"
  mission: string;                // one-sentence purpose
  responsibilities: string[];     // what this employee owns
  capabilities: string[];         // tool/capability keys it can use
  requiredTools: string[];        // minimum tool requirements
  kpis: string[];                 // KPI keys this employee monitors
  permissions: string[];          // required permission policy keys
  escalationRules: string[];      // conditions for escalation
  lifecycle: "available" | "draft";
}
```

### Registered AI Employees (64 total across 11 packs)

#### general-smb (10 employees — base pack, all industries)
| Key | Label | KPIs Monitored |
|-----|-------|---------------|
| `smb_ceo` | CEO | smb_revenue_growth, smb_net_profit_margin, smb_customer_retention |
| `smb_cfo` | CFO | smb_gross_margin, smb_cash_flow, smb_operating_expense_ratio |
| `smb_cmo` | CMO | smb_customer_acquisition_cost, smb_lead_conversion_rate |
| `smb_coo` | COO | smb_employee_utilization, smb_revenue_per_employee |
| `smb_hr_manager` | HR Manager | smb_employee_utilization |
| `smb_sales_manager` | Sales Manager | smb_lead_conversion_rate, smb_customer_lifetime_value |
| `smb_customer_success` | Customer Success Manager | smb_customer_retention |
| `smb_operations_analyst` | Operations Analyst | All operational KPIs |
| `smb_growth_hacker` | Growth Hacker | smb_revenue_growth, smb_customer_acquisition_cost |
| `smb_data_analyst` | Data Analyst | All KPIs |

#### Vertical Pack Employees (6 per pack × 10 vertical packs = 54)

Each vertical pack provides: Operations Manager, Scheduling Coordinator, Customer Relations Manager, Billing/Finance Coordinator, Marketing Coordinator, and a domain-specific specialist (e.g., Quality Inspector for cleaning, Head Barista for coffee).

**accounting** (6): `acct_managing_partner`, `acct_billing_manager`, `acct_client_manager`, `acct_business_developer`, `acct_operations_manager`, `acct_compliance_coordinator`

**cleaning** (6): `clean_operations_manager`, `clean_scheduling_coordinator`, `clean_quality_inspector`, `clean_customer_relations_manager`, `clean_supply_coordinator`, `clean_team_supervisor`

**coffee-shop** (6): `cafe_cafe_manager`, `cafe_head_barista`, `cafe_inventory_coordinator`, `cafe_customer_experience_manager`, `cafe_marketing_coordinator`, `cafe_shift_supervisor`

**dental** (6): `dental_practice_manager`, `dental_patient_coordinator`, `dental_billing_coordinator`, `dental_scheduling_coordinator`, `dental_marketing_coordinator`, `dental_compliance_officer`

**home-care** (6): `hcare_care_coordinator`, `hcare_caregiver_manager`, `hcare_client_relations_manager`, `hcare_scheduling_coordinator`, `hcare_billing_coordinator`, `hcare_quality_assurance_manager`

**home-services** (6): `hs_dispatcher`, `hs_operations_manager`, `hs_service_manager`, `hs_customer_success_manager`, `hs_revenue_manager`, `hs_inventory_coordinator` *(draft)*

**landscaping** (6): `lscape_operations_manager`, `lscape_estimator`, `lscape_crew_dispatcher`, `lscape_customer_relations_manager`, `lscape_equipment_coordinator`, `lscape_seasonal_planner`

**legal** (6): `legal_managing_partner`, `legal_billing_manager`, `legal_client_relations_manager`, `legal_business_developer`, `legal_operations_manager`, `legal_intake_coordinator`

**restaurant** (6): `rest_general_manager`, `rest_kitchen_manager`, `rest_floor_manager`, `rest_reservations_coordinator`, `rest_revenue_manager`, `rest_guest_experience_coordinator`

**retail** (6): `retail_store_manager`, `retail_inventory_manager`, `retail_sales_floor_lead`, `retail_loss_prevention_coordinator`, `retail_customer_experience_manager`, `retail_merchandising_coordinator`

---

## KPI Registry

### KpiEntry Interface

```typescript
interface KpiEntry {
  key: string;           // e.g. "smb_revenue_growth"
  label: string;         // display name
  formula: string;       // calculation description
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually";
  targetRange: { min?: number; max?: number; unit: string; direction: "higher_better" | "lower_better" };
  industryPackKey: string;
}
```

### KPI Count by Pack

| Pack | KPIs |
|------|------|
| general-smb | 11 |
| accounting | 10 |
| cleaning | 10 |
| coffee-shop | 10 |
| dental | 10 |
| home-care | 10 |
| home-services | 10 (includes `hs_estimate_acceptance_rate`) |
| landscaping | 10 |
| legal | 10 |
| restaurant | 10 |
| retail | 10 |
| **Total** | **111 KPIs** |

### KPI Data Flow

```
Industry Pack (formula definition)
    │
    ▼
KpiDerivation.deriveKpiReadings(KpiSnapshotInput)
    │  reads: revenue, expenses, appointments, invoices,
    │         payments, reviews, leads, jobs, customers
    ▼
KpiReading { kpi_key, value, unit, measured_at }
    │
    ├──▶ kpi_readings table (time-series)
    └──▶ business.kpi.measured event
              │
              ▼
         kpi.threshold.exceeded (if value crosses threshold)
```

---

## AI Inference Pipeline

When a Loop task of type `ai` executes, the following pipeline runs:

```typescript
// 1. Decision: what tool to call and with what input
const decision = decideAiEmployeeAction({
  employeeKey, capabilityKey, requestedBy, input
});

// decision.kind === "escalate" → publish escalation event, stop
// decision.kind === "tool_request" → continue

// 2. Inference: Claude API enriches the tool input with AI reasoning
if (process.env.ANTHROPIC_API_KEY && employee) {
  const inference = await runAiEmployeeInference({
    employeeKey, employeeRole, employeeMission,
    capabilityKey, taskInput
  });
  // inference.enrichedInput replaces raw input
  // inference.reasoning stored in event payload
}

// 3. Execution: tool fabric executes the enriched request
const execution = await toolFabric.requestTool(orgId, businessId, {
  ...decision.toolRequest, input: enrichedInput
});

// 4. Memory: result stored for future context
await repos.memoryRecords.upsert({
  ownerType: "agent", ownerId: employeeKey,
  key: `last_execution:${capabilityKey}`,
  value: { toolExecutionId, status, occurredAt }
});
```

### AI Model Configuration
- **Model**: `claude-sonnet-4-6` (canonical — never change without architecture review)
- **API key**: `ANTHROPIC_API_KEY` environment variable
- **Inference is optional**: If key is absent, raw decision input is used without LLM enrichment

---

## Memory Architecture

### MemoryRecord Table
```sql
memory_records (
  org_id, business_id,
  owner_type CHECK ('agent' | 'business'),
  owner_id,      -- employeeKey for agents, businessId for business
  key,           -- e.g. "last_execution:send_invoice"
  value jsonb,   -- arbitrary state
  expires_at     -- null = permanent; set for TTL-based memory
)
UNIQUE (org_id, business_id, owner_type, owner_id, key)
```

### Memory Patterns

| Pattern | owner_type | key | value | expires_at |
|---------|-----------|-----|-------|-----------|
| Last execution result | agent | `last_execution:{capabilityKey}` | `{toolExecutionId, status, occurredAt}` | null |
| Business context cache | business | `context:snapshot` | Full business context | +24h |
| Agent conversation state | agent | `conversation:{sessionId}` | Message history | +1h |
| Learning outcome | agent | `learning:{date}` | Lessons learned | null |

---

## AI Data Consumers by Entity

| Entity | AI Readers | AI Writers |
|--------|-----------|-----------|
| `businesses` | All employees | System only |
| `business_dna` | All employees for tone/style | DiagnosticEngine |
| `business_health` | All employees, BTE | HealthService |
| `business_capabilities` | DiagnosticEngine, RecommendationEngine | CapabilityService |
| `constraint_instances` | RecommendationEngine, DecisionEngine | ConstraintEngine |
| `recommendation_instances` | DecisionEngine, BTE | RecommendationEngine |
| `business_decisions` | BTE, ExecutionPlanService | DecisionEngine |
| `kpi_readings` | All employees | KpiMeasurementService |
| `memory_records` | Each agent reads own memory | LoopRuntimeService |
| `customers` | CustomerSuccess AI, Sales AI | CustomerService |
| `leads` | Sales Manager AI | LeadService |
| `jobs` | Dispatcher AI, Operations AI | JobService |

---

## Learning Loop

```
1. AI employee executes task → result stored in memory_records
2. Outcome verified → business.outcome.verified event
3. decision.measured event → actual_roi recorded
4. business.learning.recorded event emitted
5. Future inference calls receive prior execution context via memory
```

### Feedback Capture

| Signal | Source | Storage |
|--------|--------|---------|
| Recommendation approved/dismissed | Human decision | `recommendation_instances.status` |
| Decision actual_roi vs expected_roi | Post-execution measurement | `business_decisions.actual_roi` |
| NPS score | User survey | `analytics.nps.submitted` event |
| Review rating | Customer review | `customer_reviews.rating` |
| Tool execution latency | Provider evidence | `provider_evidence.latency_ms` |

---

## Multi-Agent Architecture

The platform supports multi-agent task delegation:

```typescript
// Multi-agent events
"multi_agent.plan.created"    // delegation plan generated
"multi_agent.execution.completed"  // all agents completed
"multi_agent.reflection.completed" // agents evaluated results
```

Each agent in a multi-agent plan:
1. Receives a sub-task with scoped context
2. Uses its own `memory_records` scope
3. Reports result back to orchestrating workflow
4. Escalates if decision confidence is below threshold
