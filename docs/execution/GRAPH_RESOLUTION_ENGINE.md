# Graph Resolution Engine

## Foundation Contract

`GraphResolutionEngine` provides deterministic, one-hop foundation queries:

- resolve a node by stable ID
- resolve neighbors
- resolve ownership relationships
- resolve dependencies
- resolve upstream and downstream edges
- resolve a published graph for execution

All result collections are ordered by stable ID. Callers can pin a graph
version for reproducible historical reads.

## Runtime Boundary

Application consumers use `GraphRuntime`, not the foundation engine or
repository. The foundation engine remains infrastructure used to establish the
graph contract. Recursive traversal, validation, cache behavior, and runtime
events are defined in `GRAPH_RUNTIME.md`.

## Execution Preflight

`BusinessGraphExecutionGuard` requires:

1. a published Canonical Business Context;
2. a published tenant-matched graph; and
3. a graph whose `sourceDiscoveryVersion` equals the active context version.

Workflow and agent runtimes can reuse this guard. No current automation
component performs direct graph traversal.
