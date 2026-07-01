# RC2.1 — Gap Analysis

**Date:** 2026-07-01

---

## Gaps Closed by This Pack

All gaps are closed by adding entries to existing registries. Zero core changes.

| Gap | Closed By |
|-----|-----------|
| No field service KPIs | 10 new entries in `kpiRegistry` |
| No lead-to-cash workflow | `lead_intake` + `estimate_creation` + `quote_approval` + `job_scheduling` + `job_execution` + `invoice_generation` + `payment_confirmation` workflows |
| No technician dispatch | `technician_dispatch` workflow + `ai_dispatcher` employee |
| No emergency dispatch | `emergency_dispatch` workflow + `emergency_priority` constraint |
| No maintenance plan workflow | `maintenance_follow_up` workflow |
| No field service decisions | 7 new decision templates |
| No dispatcher AI role | `ai_dispatcher` AI employee |
| No field service constraints | `callback_rate_high`, `low_tech_utilization`, `missed_dispatch`, `low_estimate_acceptance` |
| No industry MRI questions | 5 new MRI questions in home services section |
| No GPS/mapping provider | `provider_gps_mapping` definition |
| No e-signature provider | `provider_esignature` definition |
| No industry playbooks | `dispatch_playbook`, `job_execution_playbook`, `maintenance_playbook` |

---

## Remaining Platform Gaps (Future)

| Gap | Notes | When |
|-----|-------|------|
| Real-time GPS tracking UI | Would need map component in workspace | RC2.3+ |
| Technician mobile app | Field tech needs a different UX than owner | RC3+ |
| Parts inventory tracking | No inventory service yet | RC3+ |
| Live job status updates | Would benefit from Supabase Realtime | Post-auth (TD-030) |
| SMS dispatch notifications | SMS provider not yet connected | RC2.3+ |
| E-signature flow in UI | Needs dedicated page | RC2.3+ |

---

## Architecture Validation

This pack introduces **zero new platform primitives**. All entries are pure data conforming to existing `RegistryEntry` sub-interfaces. The pack is fully idempotent (guarded by `installed` flag). Multi-tenant isolation is enforced at the service layer, not the pack layer.

**Architecture violations: 0**
