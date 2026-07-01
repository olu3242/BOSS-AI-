# PI-2 Architecture Assessment

Date: 2026-06-27
Scope: Phase 1 only

## Executive Finding

The Business Capability Platform addresses a real P0 gap: converting an
approved business recommendation into an executable plan without requiring the
owner to engineer a workflow.

The proposal is not safe to implement literally. BOSS already uses
`Capability` for:

1. Canonical business capability vocabulary in `@boss/types`.
2. Tenant-specific `BusinessCapabilityAssessment` records.
3. Atomic executable capability metadata in `capabilityRegistry`.

A fourth generic `Capability` aggregate, `capabilityRegistry`, or
`capabilities` table would create semantic and persistence collisions.

The approved integration concept is therefore:

- Product name: **Business Capability Platform**
- Tenant aggregate: **Business Outcome Plan**
- Static template: **Business Outcome Definition**
- Existing `capabilityRegistry`: atomic reusable abilities only
- Existing execution registries: referenced by immutable ID and version
- Existing Loop Runtime: sole execution owner

## Frozen Architecture Compatibility

ADR-0006 freezes registry, intelligence, runtime, tenancy, event, repository
and migration boundaries. PI-2 can proceed only as an additive extension:

- A new package may own Business Outcome Plan domain rules.
- MCP may resolve diagnostic evidence into candidate outcome definitions.
- API application services may authorize, approve and submit plans.
- Loop may consume an already-resolved execution command.
- Existing registries and runtimes are not renamed or rewritten.

A proposed ADR-0007 is required before Phase 2 to approve the new bounded
context, terminology, dependency direction and compatibility contract.

## Existing Bounded Contexts

| Context | Responsibility and public surface | Dependencies | Runtime / security / readiness |
| --- | --- | --- | --- |
| `@boss/types` | Canonical ontology including Business, MRI, health, capability assessment, constraints and recommendations | None | Types only; stable foundation |
| `@boss/registries` | Readonly metadata for agents, atomic capabilities, workflows, automations, triggers, events, policies, lifecycle and dependency graph | Types, shared | Declarative; no tenant state or execution |
| General SMB pack | Seeds agents, atomic capabilities, workflows and governance metadata | Registries only | Internal-alpha definitions |
| `@boss/mcp` | Deterministic DNA, health, constraint, recommendation and roadmap intelligence | Types, shared, registries | No execution; tested |
| `@boss/events` | Tenant/actor/request/correlation/trace event envelope and in-memory dispatch | Types, shared | Journal adapter exists; subscriber retry is not durable |
| `@boss/loop` | Workflow, agent, queue, scheduler, telemetry and resilience execution primitives | Types, shared, events, registries | Internal-alpha; no business knowledge |
| `@boss/db` | SQL migrations, repository contracts, PostgreSQL and memory adapters | Types, shared, PostgreSQL | Nine migrations validate locally; RLS is partial |
| `@boss/api` | Application composition, business services, identity, authorization and adapters | Runtime contexts | Typed internal API; only health has HTTP |
| `@boss/web` | Next.js root command center and demo journey | API, types, shared, UI | Synthetic dashboard; no authenticated MVP flow |
| `@boss/ui` | Formatting and display-tone helpers | None | No full component system |

## Existing Domain Flow

```text
Business Profile
  -> MRI responses
  -> Business DNA and Health
  -> Capability Assessment
  -> Constraint Detection
  -> Recommendation and Roadmap
  -> Manual Approval
  -X-> Executable plan mapping
  -> Workflow / Agent / Automation Runtime
```

PI-2 should fill only the marked mapping gap for the MVP.

## Public API Assessment

- Current controllers are typed in-process facades, not versioned REST.
- Authentication and organization authorization exist as application helpers.
- No GraphQL surface exists.
- Rate limiting is absent.
- No capability API should be exposed until browser identity and centralized
  HTTP authorization are wired.
- Phase 2 should begin with application commands and queries; REST is a later
  adapter, not the domain contract.

## Readiness Summary

| Area | Readiness | Finding |
| --- | --- | --- |
| Registry references | Ready with constraints | Stable IDs exist; versions must be captured in plan snapshots |
| Recommendation source | Ready | Approved recommendation and roadmap persistence exist |
| Workflow definitions | Partial | Six definitions exist but remain `draft` |
| Agent execution | Partial | Internal-alpha runtime is tested |
| Automation execution | Partial | Durable contracts exist; deployed recovery is uncertified |
| Identity / tenant | Partial | Central helpers exist; browser and HTTP enforcement are open |
| Governance | Partial | Registries exist; runtime enforcement is incomplete |
| Observability | Partial | Context and metrics exist; production exporters are absent |
| UI | Not ready | No outcome-plan review or approval experience |
| Marketplace / learning / simulation | Not implemented | Deferred under MVP freeze |

## Architecture Decision

Phase 1 assessment is complete. Full enterprise Phase 2 is **NO-GO**.
A narrow P0 Business Outcome Plan foundation is **CONDITIONAL GO** after the
prerequisites in `PHASE1_CERTIFICATION.md` are accepted.
