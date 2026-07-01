# RC2.1 — Reuse Matrix

**Classification:** Reuse / Extend / Merge / Deprecate / Leave Unchanged

---

## Platform Layer

| Component | Classification | Notes |
|-----------|---------------|-------|
| `createRegistry()` factory | **Reuse** | Unchanged |
| `RegistryEntry` interface | **Reuse** | Unchanged |
| `DurableEventBus` | **Reuse** | Unchanged |
| `LoopRuntimeService` | **Reuse** | Executes declarative workflows |
| `WorkflowGenerationService` | **Reuse** | Generates from registry |
| `BusinessDecisionService` | **Reuse** | Uses registry templates |
| `BusinessHealthService` | **Reuse** | Derives from MRI responses |
| `KpiMeasurementService` | **Reuse** | Measures any registered KPI |
| `WorkspaceService` | **Reuse** | Assembles any workspace |
| `BusinessOperatingLoopService` | **Reuse** | 24h loop, industry-agnostic |
| `RootCauseService` | **Reuse** | Reasons over registered KPIs |
| `ObservabilityService` | **Reuse** | Unchanged |
| `FeatureFlagService` | **Reuse** | `operating_loop` gates pack |
| `ProductAnalyticsService` | **Reuse** | Tracks industry pack events |
| `CustomerHealthService` | **Reuse** | Unchanged |

## Registry Entries

| Registry | Classification | Notes |
|----------|---------------|-------|
| Existing `kpiRegistry` entries | **Reuse** | lead_response_time, revenue, etc. still apply |
| New industry KPI entries | **Extend** | 10 home-services-specific KPIs |
| Existing `workflowRegistry` entries | **Reuse** | invoice_follow_up, review_request reusable |
| New industry workflow entries | **Extend** | 11 field-service workflows |
| Existing `decisionRegistry` entries | **Reuse** | improve_cash_flow, reduce_admin still apply |
| New industry decision entries | **Extend** | 7 field-service decisions |
| Existing `aiEmployeeRegistry` entries | **Reuse** | ceo_advisor, ai_front_desk reusable |
| New industry AI employees | **Extend** | 6 field-service roles |
| Existing `capabilityRegistry` | **Reuse** | All capabilities applicable |
| New industry capabilities | **Extend** | field_ops, dispatch, scheduling |
| Existing `constraintRegistry` | **Reuse** | cash_flow, admin, reviews still apply |
| New industry constraints | **Extend** | missed_dispatch, callback_rate, tech_utilization |
| Existing `playbook` entries | **Reuse** | |
| New industry playbooks | **Extend** | dispatch_playbook, job_execution_playbook |
| `providerDefinitionRegistry` | **Extend** | Add GPS, e-sign providers |
| `toolDefinitionRegistry` | **Extend** | Add route_optimization, esignature tools |

## Frontend

| Component | Classification | Notes |
|-----------|---------------|-------|
| `/business/[id]/workspace` | **Reuse** | Unchanged — renders registered data |
| `/business/[id]/workspace/intelligence` | **Reuse** | Unchanged |
| `/business/[id]/workspace/approvals` | **Reuse** | Unchanged |
| `/business/[id]/workspace/timeline` | **Reuse** | Unchanged |
| `/business/[id]/mri` | **Reuse** | Reads from `mriRegistry` |
| `/ops` ops dashboard | **Reuse** | Unchanged |
| `/cs` CS workspace | **Reuse** | Unchanged |
| No new pages needed | — | Platform workspace is industry-agnostic |

## Deprecated / Removed

None. The home services pack is purely additive.
