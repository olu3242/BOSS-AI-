# ADR 0011: Adopt the Canonical Business Model

- Status: Accepted
- Date: 2026-06-28

## Context

BOSS has strong technology contracts but needs one stable business language to
prevent industry packs, intelligence capabilities, APIs, and customer surfaces
from redefining customers, goals, decisions, plans, executions, and outcomes.

## Decision

Adopt `CANONICAL_BUSINESS_MODEL.md` as the authoritative business semantic
contract. Center canonical state on the existing Business Graph. Define
Business Memory as an evidence-backed, versioned semantic view of that graph,
not a parallel store.

Industry capabilities specialize the model through governed metadata, rules,
policies, and views. New base concepts require CBM review and an ADR.

## Consequences

- Business semantics remain stable across industries and interfaces.
- Certified Context, Graph, Semantic, and BQIL layers are reused.
- PI-2 must introduce Signals, Memory, Opportunities, Decisions, Plans,
  Outcomes, and Learning incrementally against this model.
- Legacy models remain compatibility paths until migrated and certified.
