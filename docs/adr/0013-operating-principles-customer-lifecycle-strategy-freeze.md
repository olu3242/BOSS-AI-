# ADR 0013: Adopt Operating Principles, Customer Lifecycle, and Strategy Freeze

- Status: Accepted
- Date: 2026-06-28

## Context

BOSS needs company-wide decision principles and a customer journey model, but
continued foundational ideation now risks overlapping authorities and delaying
implementation specifications.

## Decision

Adopt `OPERATING_PRINCIPLES.md` for company decisions and
`CUSTOMER_LIFECYCLE_FRAMEWORK.md` for the customer journey. Freeze foundational
strategy through `STRATEGY_FREEZE.md`.

Future work must produce bounded implementation specifications or certified
implementation. New strategy concepts require ARB review and a superseding ADR.

## Consequences

- Company, product, architecture, operation, maturity, and customer journey
  each have one document owner.
- Pull requests evaluate measurable value as well as architecture.
- The future Success capability remains unimplemented and entry-gated.
- The next implementation remains UCR Batch 3, not PI-2 feature expansion.
