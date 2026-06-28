# Graph Cache

## Model

`GraphCache` has two tenant-aware stores:

- immutable snapshots keyed by `orgId`, `businessId`, and graph version;
- traversal results keyed by tenant, business, version, operation, and node.

Historical version reads can be served directly from cache. A current-version
request first resolves the authoritative repository state, then caches that
exact version. This avoids stale mutable aliases.

## Invalidation

`GraphRuntime` subscribes to `business.graph.versioned`. Any accepted mutation
invalidates all snapshot and traversal entries for that tenant and business.
The next load repopulates the exact version and emits
`business.graph.cache.refreshed`.

Shutdown clears all entries. Cache state is process-local and contains no
cross-tenant key paths.

## Consistency Evidence

The runtime test caches a historical version, confirms a cache hit, mutates the
published graph, then proves the next current read returns the new graph
version and newly added node.

## Limitation

Distributed cache invalidation depends on delivering graph version events to
each runtime process. A shared cache or broker-backed subscriber is required
before horizontal production deployment.
