# ADR 0014: Adopt the Product Operating Model

- Status: Accepted
- Date: 2026-06-28

## Context

BOSS has frozen its foundational strategy and established architecture and
engineering governance. Those controls determine how work is designed and
certified, but they do not provide a single product-intake decision that
prevents technically attractive work from outrunning customer value.

A proposed BOSS Execution Specification also combines runtime, Business
Memory, approval, replay, verification, and executive reasoning contracts.
Those concerns already have separate authorities or approved future
specifications. Adopting them as one document would reopen frozen architecture
and obscure bounded certification.

## Decision

Adopt `PRODUCT_OPERATING_MODEL.md` as the prospective product-intake gate.
Every new roadmap item must identify a business problem, time to value,
Business Operating Loop impact, trust impact, simplicity, and measurable
evidence before entering engineering.

Retain TTFBV as the activation metric and adopt minutes saved plus verified
business outcomes as the north-star outcome family. Do not combine unlike
outcomes into an unsupported composite score.

Do not adopt a monolithic BOSS Execution Specification. Route its useful
contracts through the existing bounded specification sequence for Business
Signals, Business Memory, UCR, approvals, verification, replay, and decision
protocols.

## Consequences

- Product readiness, architecture approval, and engineering certification are
  explicit independent gates.
- Pull requests carry the customer problem, scorecard, and value measurement
  through implementation.
- Platform work without near-term direct customer value requires clear
  prerequisite evidence and cannot use reusability alone as justification.
- Existing certifications are unchanged; the decision applies prospectively.
- UCR Batch 3 remains the next approved implementation batch.

