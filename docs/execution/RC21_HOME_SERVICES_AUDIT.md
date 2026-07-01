# RC2.1 — Home Services Industry Pack Audit

**Date:** 2026-07-01
**Status:** PRE-IMPLEMENTATION

---

## Scope

Audit all existing BOSS capabilities for reuse/extension by the Home Services Industry Pack (HVAC, Plumbing, Electrical, Garage Door, Appliance Repair).

---

## Existing Platform Capabilities Inventory

### Registries (all in `@boss/registries`)
| Registry | Entries | Status |
|----------|---------|--------|
| `kpiRegistry` | 11 entries (general SMB) | **Extend** — add 10 industry KPIs |
| `workflowRegistry` | 6 entries | **Extend** — add 11 industry workflows |
| `decisionRegistry` | ~8 entries | **Extend** — add 7 decision templates |
| `aiEmployeeRegistry` | 3 entries | **Extend** — add 6 field service roles |
| `capabilityRegistry` | 15+ entries | **Reuse** — all capabilities applicable |
| `constraintRegistry` | 10+ entries | **Extend** — add field service constraints |
| `playbook` registry | 5+ entries | **Extend** — add dispatch/job playbooks |
| `toolDefinitionRegistry` | 10+ entries | **Extend** — add GPS/mapping/e-sign tools |
| `providerDefinitionRegistry` | existing | **Extend** — add payment/GPS providers |

### Services (all in `apps/api/src/services/`)
| Service | Status |
|---------|--------|
| `businessProfileService` | **Reuse** — create business with `industry: "hvac"` etc. |
| `businessMriService` | **Extend** — add industry MRI questions |
| `kpiMeasurementService` | **Reuse** — measures any registered KPI |
| `businessDecisionService` | **Reuse** — uses `decisionRegistry` |
| `businessRecommendationService` | **Reuse** — recommendation engine |
| `workflowGenerationService` | **Reuse** — generates from `workflowRegistry` |
| `loopRuntimeService` | **Reuse** — executes any workflow |
| `workspaceService` | **Reuse** — workspace adapts to registered data |
| `businessOperatingLoopService` | **Reuse** — 24h loop runs on any business |
| `rootCauseService` | **Reuse** — root cause from registered KPIs |
| `businessHealthService` | **Reuse** — health dimensions are registry-driven |

### Frontend (all in `apps/web/src/`)
| Component | Status |
|-----------|--------|
| Workspace layout | **Reuse** — industry-agnostic |
| KPI panel | **Reuse** — renders any `kpiKey` |
| Decisions panel | **Reuse** — renders any decision |
| Approvals workflow | **Reuse** — approves/rejects any decision |
| Intelligence page | **Reuse** — renders root cause + decisions |
| Timeline page | **Reuse** — shows any domain events |
| MRI flow | **Reuse** — reads from `mriRegistry` |

---

## Industry-Specific Gaps

| Capability | Gap | Resolution |
|-----------|-----|------------|
| Job lifecycle management | Not in platform | Add to `workflowRegistry` |
| Technician dispatch | Not in platform | Add workflow + AI employee |
| First-time fix rate KPI | Not registered | Add to `kpiRegistry` |
| Emergency priority classification | Not in registries | Add industry labels |
| Service agreement / maintenance plan | Not in platform | Add workflow |
| Estimate → Quote → Approval flow | Partial (decisions only) | Add workflow definitions |
| GPS/mapping integration | No provider | Add to `providerDefinitionRegistry` |
| Field tech utilization KPI | Not registered | Add to `kpiRegistry` |
| Callback rate KPI | Not registered | Add to `kpiRegistry` |
| Revenue per technician | Not registered | Add to `kpiRegistry` |
