# Business Insight Service

## Scope

`BusinessInsightService` produces factual statements from the selected
Semantic Snapshot and Business Projection:

- matching entity count
- matching relationship total
- unrepresented query entity categories
- Semantic Context lifecycle
- query-context completeness
- execution entity count for `execution_context`

Each insight contains a stable ID, type, statement, typed value, semantic
evidence references, and timestamp.

## Non-Goals

The service does not:

- diagnose a business;
- calculate business health;
- classify gaps;
- infer missing facts;
- recommend actions;
- prioritize work;
- generate strategy or plans.

Context completeness is the factual percentage of registered query entity
categories represented in the snapshot. It is not a health score.

## Reproducibility

Insight values depend only on the registered query definition and immutable
Semantic Snapshot. Repeated cached executions reuse the same view and insight
objects while recording a new Query Execution and audit event.
