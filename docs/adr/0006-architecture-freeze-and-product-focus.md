# ADR-0006: Freeze the platform architecture and optimize for first business value

**Status:** accepted
**Date:** 2026-06-27

## Context

BOSS has established canonical registries, a Business Execution Model,
deterministic intelligence, event and execution contracts, tenant context,
runtime boundaries, and persistence conventions. Reworking these foundations
would delay validation of the actual customer proposition.

The immediate product question is whether a small-business owner can move from
first visit to a diagnosed problem, approved plan, executed automation, and
visible result quickly enough to experience value.

## Decision

The following architecture is frozen:

- Canonical ontology and organization tenancy model.
- Registry-first metadata and capability-pack model.
- MCP intelligence and Loop execution ownership boundary.
- Event context carrying organization, actor, request, correlation, and trace.
- Workflow, agent, automation, policy, governance, and lifecycle registries.
- Repository interfaces with in-memory and PostgreSQL adapters.
- Sequential SQL migration strategy and backward-compatible public contracts.

Changes to frozen layers are limited to:

- Defect and security fixes.
- Backward-compatible production adapters.
- Measured performance or reliability improvements.
- Proven product requirements that cannot be satisfied through existing
  extension points.

Any other change requires a new ADR containing executable evidence, migration
and compatibility impact, rejected extension-based alternatives, and explicit
approval before implementation.

Product work is scoped by `docs/product/MVP_FEATURE_FREEZE.md`. The primary
product metric is Time to First Business Value (TTFBV), measured from
`landing_viewed` through `first_value_visible`.

## Consequences

- Engineering effort moves from architecture breadth to one complete customer
  journey.
- P2 platform and enterprise work remains blocked until every P0 capability is
  connected and demonstrated end to end.
- Registry or runtime additions must support a concrete P0 journey gap.
- Existing internal-alpha capabilities are reused and productionized rather
  than replaced.
- Architecture quality remains necessary but is no longer a proxy for product
  value.

## Alternatives Considered

- Continue enterprise-scale and autonomous programs. Rejected because their RC
  and GA prerequisites are unmet and they do not reduce TTFBV.
- Redesign the runtime around the MVP. Rejected because current extension
  points support the journey and a rewrite would add risk without customer
  evidence.
- Track only technical delivery metrics. Rejected because they do not measure
  whether a customer reaches a useful business outcome.
