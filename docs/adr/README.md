# Architecture Decision Records

Every architecturally significant decision is recorded here as a
numbered, immutable Markdown file: `NNNN-short-title.md`.

- Number sequentially, never reuse or renumber.
- Status is one of: `proposed`, `accepted`, `superseded by ADR-NNNN`, `rejected`.
- Once accepted, an ADR is not edited except to mark it superseded —
  write a new ADR instead.
- Use `TEMPLATE.md` as the starting point for a new ADR.

| ADR | Title | Status |
|-----|-------|--------|
| [0001](./0001-monorepo-normalization.md) | Monorepo normalization with pnpm + Turborepo | accepted |
| [0002](./0002-registry-driven-capability-packs.md) | Registry-driven capability packs over hardcoded industry logic | accepted |
| [0003](./0003-business-intelligence-layer.md) | Deterministic Business Intelligence layer | accepted |
| [0004](./0004-constraint-intelligence-engine.md) | Registry-driven Constraint Intelligence | accepted |
| [0005](./0005-recommendation-intelligence-engine.md) | Recommendation Intelligence and transformation roadmaps | accepted |
| [0006](./0006-architecture-freeze-and-product-focus.md) | Architecture freeze and first-value product focus | accepted |
