# Graph Versioning

## Strategy

The current normalized node and edge tables support efficient authoritative
reads. Every accepted mutation also writes a complete immutable JSON snapshot.
This dual representation provides current-state integrity and exact historical
reconstruction.

```text
mutation
  -> lock current aggregate
  -> compare expected lock version
  -> replace normalized current content
  -> increment graph and lock versions
  -> insert immutable snapshot
  -> append history entry
  -> commit
```

## Context Synchronization

Each graph version records `sourceDiscoveryVersion`. Synchronization projects
the latest published Canonical Business Context deterministically. Execution
preflight rejects a graph that is stale relative to context.

## Recovery

`getVersion` reconstructs a historical graph from its immutable snapshot.
Snapshots are never updated. Runtime sessions pin the selected graph version,
so later graph changes cannot alter an active traversal.

## Concurrency

In-memory and PostgreSQL repositories enforce the same expected-lock contract.
The PostgreSQL implementation uses a transaction and row lock. A stale writer
receives `BusinessGraphConcurrencyError`.
