# BQIL Performance

## Instrumentation

`BusinessQueryService.performance()` reports:

- executions
- cache hits and misses
- hit ratio
- average query latency
- average projection generation time
- query, projection, and context cache sizes

## Cache Strategy

Context, projection, and query artifacts are keyed by tenant, business,
semantic version, query ID, pagination, and stable parameters. BQIL first asks
Semantic Layer for the authoritative version, then reuses its local immutable
context entry.

`business.semantic.updated` invalidates all BQIL entries for the affected
tenant and business. Historical graph-version queries remain reproducible when
reloaded.

## Executable Baseline

The integration baseline executes all 14 catalog queries plus repeated,
paginated, and streamed requests:

- 19 measured executions before invalidation;
- 2 cache hits and 17 misses;
- cache hit ratio `2 / 19` for the catalog-first workload;
- average query latency budget below 1,000 ms;
- average projection generation budget below 1,000 ms;
- cache sizes reset to zero after semantic invalidation.

These are CI regression budgets, not production SLOs. Production latency,
memory, and distributed-cache baselines require a deployed environment.

## Limitation

Caches are process-local. Horizontal deployment requires broker-backed
invalidation for every process or a shared version-aware cache.
