## Summary

<!-- What changed, and why — focus on the "why". -->

## Bounded context

<!-- Which context/package owns this change? -->

## Product Operating Model

- Customer and business problem:
- Measurable customer outcome:
- Customer Lifecycle stage:
- Time-to-value target and measurement point:
- Product Scorecard (Outcome / TTV / Loop / Trust / Simplicity / Reuse / Evidence):
- Day-One Test:
- Small Business Filter:
- Non-goals:

## Architecture Review Board

- Customer Lifecycle stage and measurable outcome:
- Business Operating Loop stage:
- Canonical Business Model entities/relationships:
- Canonical state owner:
- UCR execution path or migration exception:
- Decision and outcome evidence:
- Replay, observability, tenancy, and policy model:
- Time-to-value or measured business outcome:
- Compatibility, rollback, and certification impact:

## Checklist

- [ ] Satisfies `docs/execution/DEFINITION_OF_DONE.md`
- [ ] Passes the ARB questions in `docs/execution/ARCHITECTURE_REVIEW_BOARD.md`
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` pass locally
- [ ] `pnpm arch:check` passes
- [ ] `MEMORY.md` updated
- [ ] `CHANGELOG.md` updated
- [ ] ADR added/linked if this is architecturally significant: <!-- link -->

## Test plan

<!-- How did you verify this? -->
