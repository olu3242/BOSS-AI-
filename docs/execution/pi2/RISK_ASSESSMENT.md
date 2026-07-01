# PI-2 Risk Assessment

Date: 2026-06-27

| Risk | Severity | Evidence | Mitigation / gate |
| --- | --- | --- | --- |
| Capability semantic collision | Critical | Three existing capability meanings | Use Business Outcome Plan terminology and prefixed schema |
| Frozen architecture bypass | High | Proposed `domains/capabilities` conflicts with workspace pattern | ADR and `packages/business-outcomes` boundary required |
| Registry duplication | Critical | Existing capability/workflow/agent registries | References only; no copied definitions |
| Draft workflow execution | High | Six current workflows are `draft` | Certify one workflow before selection |
| Tenant leakage | Critical | Browser/HTTP auth and deployed RLS incomplete | No external API until fail-closed tests pass |
| Resolver becomes second runtime | Critical | Proposal says “invoke RIP” without command boundary | Resolver validates/submits only; Loop executes |
| Approval/execution race | High | Approval resume is incomplete | Bind approval to immutable version/hash |
| Stale registry version | High | Runtime checks workflow ID, not version | Snapshot and validate versions before enqueue/execution |
| Event naming collision | Medium | Generic `capability.*` conflicts with atomic capability | Use `business.capability.*` |
| Overbuilt enterprise scope | High | Proposal includes marketplace, analytics and learning | Restrict Phase 2 to P0 vertical slice |
| False compliance claims | High | No SOC 2/HIPAA evidence | Use readiness, never certification language |
| Observability gap | High | No production exporter or alerts | Block beta; retain context and add plan metrics |
| Notification gap | Medium | No notification runtime | Provide in-app status before external channels |
| Unmeasured product value | High | TTFBV has no real sessions | Emit journey stages and publish real percentiles |

## Overall Risk

Full enterprise implementation: **unacceptable**.

Narrow internal P0 vertical slice after prerequisites: **manageable**.
