# ADR 0010: Adopt the BOSS Execution Constitution

- Status: Accepted
- Date: 2026-06-28

## Context

BOSS has accumulated strong platform contracts, but future product initiatives
could still fragment state, orchestration, evidence, or customer outcomes if
each feature is evaluated independently.

## Decision

Adopt `EXECUTION_CONSTITUTION.md` as the highest-level product and engineering
governance document. Apply it immediately to new work while tracking
future-state invariants that depend on uncertified Business Signal, Business
Memory, UCR resilience, replay, and customer-experience capabilities.

Use Production Increments for strategic outcomes and
Epic -> Capability -> Batch -> Certification for engineering delivery.

## Consequences

- New work must state its business outcome, execution path, evidence, and
  constitutional capability.
- Large multi-context superprompts must be decomposed.
- Future-state principles cannot be represented as completed enforcement.
- Existing certified contracts remain authoritative until governed migration.
