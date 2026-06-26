# Definition of Done

A change is "done" only when every applicable item below is true. This
mirrors the Implementation Governance checklist in `CLAUDE.md`.

- [ ] Bounded context identified — code lives in the package that owns it.
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
- [ ] Feature flag created if the change should be rolled out gradually.
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` pass locally.
- [ ] `pnpm arch:check` passes (no boundary violations, no circular deps,
      no new dead code).
- [ ] `MEMORY.md` and `CHANGELOG.md` updated in the same PR.
- [ ] ADR written for architecturally significant decisions
      (`docs/adr/TEMPLATE.md`).
