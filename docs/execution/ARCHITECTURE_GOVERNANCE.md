# BOSS Architecture Governance

## Authority Chain

```text
Operating Principles
-> Execution Constitution
-> Product Operating Model
-> Canonical Business Model
-> Business Operating Loop and Business Maturity Model
-> Customer Lifecycle Framework
-> Master Program Plan
-> Engineering Operating System
-> ADRs and Architecture Boundaries
-> Capability Gates
-> Batch Certification
```

## Review Gates

| Gate | Required constitutional evidence |
| --- | --- |
| Product intake | POM gates, scorecard, Day-One Test, small-business fit, measurable outcome |
| Discovery | Business problem, outcome, customer lifecycle stage, TTFBV effect |
| Architecture | CBM mapping, state owner, UCR path, registries, events, evidence, policy, tenancy |
| Engineering | Real implementation, migration compatibility, no bypass |
| Validation | Typecheck, lint, tests, build, architecture, dead code, applicable security/performance |
| Certification | Evidence-backed GO, environmental blockers, or NO-GO |
| Release | Upgrade, rollback, observability, operator ownership |

## Enforcement Matrix

| Invariant | Current enforcement |
| --- | --- |
| Runtime contains no business knowledge | Dependency boundaries and review |
| Registry-first metadata | Registry tests and certification |
| Tenant and trace context | Typed contracts and integration tests |
| Evidence and telemetry | Required interfaces and batch tests |
| One UCR path for new capabilities | UCR registry and architecture review |
| No legacy runtime bypass | Migration gate; not yet platform-wide |
| Business Signals first | Entry gate until Signal Engine certification |
| Business Memory canonical | Entry gate until Memory certification |
| Deterministic replay | Production gate until UCR resilience certification |
| Five-minute value | Browser journey gate once PI-2 customer flow exists |

## Change Control

Core contract changes require:

1. ADR.
2. Dependency and compatibility analysis.
3. Migration and rollback strategy.
4. Updated registry and event contracts.
5. Security, tenant, evidence, and observability review.
6. Full validation and renewed certification.

Constitutional changes apply prospectively, require architecture review, and
must identify affected certifications. No prompt or individual session may
silently override this governance chain.
