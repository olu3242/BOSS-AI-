# RC2.2 — Dental Industry Pack Audit

**Date:** 2026-07-01
**Status:** PRE-IMPLEMENTATION

---

## Scope

Audit all existing BOSS capabilities for reuse/extension by the Dental Industry Pack (general dentistry, orthodontics, oral surgery, pediatric dentistry).

---

## Existing Capabilities Review

### Platform Services (from RC2.1 analysis — still valid)
All 20+ platform services are reusable unchanged. Same as RC2.1.

### Registry Gaps for Dental

| Capability | Gap | Resolution |
|-----------|-----|------------|
| Chair utilization KPI | Not registered | Add to `kpiRegistry` |
| Provider production KPI | Not registered | Add to `kpiRegistry` |
| Case acceptance rate KPI | Not registered | Add to `kpiRegistry` |
| Recall completion rate KPI | Not registered | Add to `kpiRegistry` |
| No-show rate KPI | Not registered | Add to `kpiRegistry` |
| Hygiene reappointment KPI | Not registered | Add to `kpiRegistry` |
| Collections ratio KPI | Not registered | Add to `kpiRegistry` |
| New patient intake workflow | Not registered | Add to `workflowRegistry` |
| Recall scheduling workflow | Not registered | Add to `workflowRegistry` |
| Treatment plan presentation | Not registered | Add to `workflowRegistry` |
| Insurance verification | Not registered | Add to `workflowRegistry` |
| Patient reactivation campaign | Not registered | Add to `workflowRegistry` |
| Practice Manager AI role | Not registered | Add to `aiEmployeeRegistry` |
| Recall Coordinator AI role | Not registered | Add to `aiEmployeeRegistry` |
| Treatment Coordinator AI role | Not registered | Add to `aiEmployeeRegistry` |
| No-show rate constraint | Not registered | Add to `constraintRegistry` |
| Open hygiene capacity constraint | Not registered | Add to `constraintRegistry` |
| Low case acceptance constraint | Not registered | Add to `constraintRegistry` |
| Practice management system integration | Not registered | Add providers |
| Digital forms provider | Not registered | Add providers |

### Reused from RC2.1 (zero changes needed)
- `workflowRegistry` — `appointment_reminder`, `review_request`, `invoice_follow_up`
- `decisionRegistry` — `improve_cash_flow`, `improve_customer_retention` still apply
- `kpiRegistry` — `revenue`, `outstanding_invoices`, `review_rating`, `customer_retention`
- `aiEmployeeRegistry` — `ai_front_desk` for patient intake
- All platform services unchanged
