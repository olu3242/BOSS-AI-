# Business Diagnostic Model

## Areas

The engine evaluates operations, customers, sales, marketing, finance, team,
productivity, technology, processes, AI readiness, automation readiness and
growth readiness.

Direct health dimensions remain authoritative where available. Process and
automation readiness are composed from persisted capability assessments.

## Area Formula

```text
gap = max(0, desired score - current score)
business impact = clamp(gap * configured area weight)
priority = clamp(business impact * confidence)
```

The initial desired score is `80`. Weight profiles are versioned and persisted
with the report.

## Root Causes

Constraint findings are ordered by their existing priority rank:

- Critical constraints become blockers.
- The first three non-critical findings become primary issues.
- Findings with dependencies become contributing factors.
- Remaining findings become risks.

The engine does not infer unsupported causal relationships.

## Opportunities

Existing evidence-backed recommendation candidates are projected into:

- Quick wins
- High-impact improvements
- Cost reduction
- Revenue growth
- Automation candidates
- AI delegation candidates

They are diagnostic opportunities, not approved strategy or execution plans.

## Maturity

Nine maturity areas use a five-level scale:

| Score | Level |
| ---: | ---: |
| 0-19 | 1 |
| 20-39 | 2 |
| 40-59 | 3 |
| 60-79 | 4 |
| 80-100 | 5 |

Each maturity result includes rationale, evidence and confidence.

## Priority Matrix

Root causes and opportunities share an explainable score:

```text
score = (
  impact * 0.40
  + urgency * 0.30
  + (100 - effort) * 0.15
) * confidence
```

The remaining weight is intentionally unallocated rather than inventing risk
or revenue values when the source evidence does not provide them.
