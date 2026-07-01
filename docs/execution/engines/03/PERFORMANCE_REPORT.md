# Business Diagnostic Engine Performance Report

## Complexity

For `A` areas, `C` constraints, `R` recommendations and `M` capability
assessments:

- Area analysis: `O(A * (C + R + M))`
- Root-cause ordering: `O(C log C)`
- Opportunity ordering: `O(R log R)`
- Priority ordering: `O((C + R) log(C + R))`
- Persistence: `O(A + C + R + M)` inserts in one report transaction

`A` is fixed at twelve and maturity areas are fixed at nine.

## Current Evidence

- The in-memory end-to-end diagnostic test completes in the normal API test
  suite, creates two report versions, and was observed at 102 ms in the final
  validation run.
- No network, model or workflow execution occurs inside diagnosis.
- Registry and weight resolution are in-process.

## Production Baseline

Not established. Required measurements:

- P50/P95/P99 generation latency against PostgreSQL.
- Query count and transaction duration.
- Report size by constraint/opportunity count.
- Concurrent tenant generation.
- Dashboard read latency.
- Event-journal latency and failure behavior.

No production performance claim is made until those measurements exist.
The observed unit/integration timing is not a production latency baseline.
