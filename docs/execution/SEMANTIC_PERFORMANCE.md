# Semantic Performance

## Cache Model

`SemanticCache` maintains:

- immutable Semantic Snapshots keyed by tenant, business, and graph version;
- Semantic Views keyed by tenant, business, graph version, and view ID.

Repeated context resolution reuses the same immutable snapshot. Repeated view
generation reuses the same immutable view. This provides context memoization,
semantic caching, and projection caching without mutable current-version
aliases.

## Invalidation

BSL subscribes to `business.graph.versioned`. A graph update invalidates all
semantic snapshots and views for that tenant and business and emits
`business.semantic.updated`. The next request resolves the authoritative graph
version through Graph Runtime and repopulates semantic caches.

## Consistency

Historical entries remain reproducible by graph version when reloaded.
Application requests cannot select another tenant because Graph Runtime,
Business Context, and BSL each validate tenant scope.

## Limitations

The cache is process-local. Horizontal deployment requires broker delivery to
every process or a shared cache with version-keyed entries. No latency or
memory production baseline is claimed without a deployed environment.
