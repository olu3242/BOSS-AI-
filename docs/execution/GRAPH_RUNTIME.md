# Graph Runtime

## Architecture

`GraphRuntime` is the application-facing graph infrastructure boundary.

```text
consumer
   |
   v
GraphRuntime.openSession
   |-- tenant check
   |-- published-state check
   |-- exact version load/cache
   v
GraphSession
   |-- GraphContext (immutable snapshot)
   |-- GraphResolver
   `-- GraphTraversalService
```

The runtime supports `stopped`, `starting`, `running`, `degraded`, and
`stopping` lifecycle states. Health reports active sessions, cache sizes,
loads, traversals, validations, hits, and misses. Construction accepts the
graph service, event bus, and cache through dependency injection.

## Context Resolution

`GraphResolver` resolves organization, department, customer, project,
workflow, automation, and AI contexts from the version-pinned session.
Resolution accepts stable node IDs or external references and returns sorted
results.

## Consumer Integration

`BusinessGraphExecutionGuard` mediates workflow and agent preflight through
Graph Runtime. Queue and automation infrastructure currently contains no
relationship traversal. Any future graph-aware automation handler must obtain
a runtime session instead of using repositories or graph edges directly.

Canonical Business Context remains upstream of graph creation. Making it
consume Graph Runtime would create a circular dependency and is intentionally
not permitted.

## Events

The runtime emits `business.graph.loaded`, `business.graph.traversed`,
`business.graph.validated`, and `business.graph.cache.refreshed`. Payloads
carry tenant, organization, business, graph version, correlation ID, trace ID,
and timestamp.
