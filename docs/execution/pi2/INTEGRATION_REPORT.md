# PI-2 Integration Report

Date: 2026-06-27

## Proposed Contract

A Business Outcome Plan is a tenant-owned, versioned snapshot that identifies
its source recommendation or owner goal, success KPI, selected workflow,
required agents/atomic capabilities/automations, and approval policy.

It contains references and business rules, not copied registry definitions or
runtime implementation.

## Resolution Sequence

1. Authorize tenant and `business_capability:manage`.
2. Load business, diagnostic evidence and approved recommendation.
3. Match a Business Outcome Definition.
4. Resolve workflow, agent, atomic capability, automation, event, policy and
   KPI references.
5. Reject missing, draft, disabled, cyclic or incompatible references.
6. Persist an immutable plan version and reference snapshot.
7. Require owner approval according to policy and risk.
8. Submit an idempotent execution command to the existing queue/runtime.
9. Correlate runtime execution IDs to the plan.
10. Project the result and KPI into the dashboard and TTFBV journey.

## Runtime Compatibility

- Context: preserve `orgId`, `actorId`, `requestId`, `correlationId`, `traceId`.
- Retry: resolver is side-effect-free; execution retry remains runtime-owned.
- Compensation: remains workflow-step behavior.
- Memory: agent memory remains agent-owned; plans store references only.
- State: plan lifecycle and runtime execution state remain separate.
- Failure: resolution failures never enqueue; runtime failures correlate back.
- Performance: registry resolution is O(number of references), with no network
  calls inside the domain model.

## Registry Integration

| Registry | Read behavior | Write behavior |
| --- | --- | --- |
| Atomic capability | Validate stable IDs and status | None |
| Workflow | Validate active compatible version | None |
| Agent | Validate deployed/active state and permissions | None |
| Automation | Validate active definition | None |
| Trigger | Manual only initially | None |
| Event | Validate declared emitted events | Add plan events through seed review |
| Policy | Resolve approval and tenant-isolation policy | None |
| KPI | Resolve success measures | None |

Dynamic tenant plans do not belong in readonly global registries.

## Event Contracts

Use the existing category convention and avoid generic `capability.*` names:

- `business.capability.created`
- `business.capability.updated`
- `business.capability.approved`
- `business.capability.execution.requested`
- `business.capability.executed`
- `business.capability.failed`
- `business.capability.archived`
- `business.capability.version.created`
- `business.capability.certified`
- `business.capability.kpi.updated`

Payload schemas must be versioned before registration. Every event includes the
existing event context.

## Security

- All commands require authenticated organization membership.
- Repository methods require `orgId`; IDs alone are insufficient.
- Owner/admin may manage and approve; execute permission is separate.
- High-risk plans require human approval and immutable approval history.
- Registry references are allow-listed, never accepted as executable code.
- Secrets belong to providers, not plan manifests.
- Audit records create, update, approve, execute, fail, archive and restore.

HIPAA and SOC 2 are readiness goals, not current certifications.

## UI Integration

MVP UI is one journey:

```text
Recommendation -> Proposed Plan -> What BOSS will do -> Approval
-> Execution progress -> Visible result and KPI
```

Marketplace, visual builder, simulation, learning and admin are deferred.

## Compatibility Finding

No runtime, registry, API or database contract must be replaced. The required
integration is a versioned plan snapshot plus an adapter that submits an
existing workflow definition to Loop.
