# Definition of Done

A change is "done" only when every applicable item below is true. This
mirrors the Implementation Governance checklist in `CLAUDE.md`.

Every change must also pass the Constitutional Test in
`EXECUTION_CONSTITUTION.md`.

New roadmap scope must first pass the product gates and scorecard in
`PRODUCT_OPERATING_MODEL.md`. Defect, security, and incident work may use the
documented emergency path but must still identify the affected customer
outcome.

Delivery is organized as Epic -> Capability -> Batch -> Certification. One
execution prompt may cover only one batch. A dependent batch starts only after
the current batch has a recorded certification decision. See
`docs/execution/DELIVERY_MODEL.md`.

- [ ] Bounded context identified — code lives in the package that owns it.
- [ ] Business problem, intended outcome, constitutional capability (Observe,
      Understand, Decide, Plan, Execute, or Learn), and success evidence are
      stated.
- [ ] Product Operating Model result, scorecard, Day-One Test, Small Business
      Filter, and time-to-value measurement are recorded for new scope.
- [ ] Canonical state owner and execution/evidence paths are identified; no
      parallel state or runtime is introduced.
- [ ] Business entities and relationships map to
      `CANONICAL_BUSINESS_MODEL.md`; new base concepts have an ADR.
- [ ] P0 journey stage identified, or the change is explicitly classified as
      backlog under `docs/product/MVP_FEATURE_FREEZE.md`.
- [ ] TTFBV impact stated: reduced time, improved outcome quality, or required
      safety/reliability for the first-value journey.
- [ ] Domain events catalogued in `packages/registries` (event registry)
      if the change emits or consumes a new event.
- [ ] Types extend the canonical ontology (`packages/types/src/ontology.ts`)
      rather than inventing competing entities.
- [ ] Database schema changes reviewed against `docs/architecture/ARCHITECTURE.md` §6.
- [ ] API contract documented (REST `/api/v1/{context}/{resource}` or
      equivalent) before implementation.
- [ ] Permission/policy entry exists in the policy registry if the change
      affects access or approval behavior.
- [ ] Telemetry plan documented — what gets emitted, where it's queried.
- [ ] Audit log entry defined for any state-mutating action.
- [ ] Empty / loading / error / success / partial UI states designed
      (UI changes only).
- [ ] Acceptance criteria written and verified.
- [ ] Customer-visible P0 behavior is exercised through the connected journey,
      not only through an isolated service or synthetic dashboard.
- [ ] Feature flag created if the change should be rolled out gradually.
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` pass locally.
- [ ] `pnpm arch:check` passes (no boundary violations, no circular deps,
      no new dead code).
- [ ] `MEMORY.md` and `CHANGELOG.md` updated in the same PR.
- [ ] ADR written for architecturally significant decisions
      (`docs/adr/TEMPLATE.md`).
