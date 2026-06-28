# Projection Engine

## Model

`ProjectionEngine` transforms one immutable Semantic Snapshot according to a
registered Query Definition. Supported projection kinds are:

- entity
- aggregate
- timeline
- relationship
- KPI
- context

Entity and relationship projections retain semantic evidence references.
Aggregate and context projections provide factual entity counts, relationship
counts, and lifecycle state. Timeline extensions order known timestamps and
then stable IDs. No diagnostic or recommendation logic exists here.

## Pagination

Projection items are sorted deterministically before pagination. Cursors are
non-negative integer offsets. Page sizes default to 50 and are constrained to
1 through 100. Results include current and next cursors plus total count.

## Streaming

`BusinessQueryService.stream()` is an async iterable over projection items.
The current implementation streams a resolved page and preserves the same
query audit and event behavior as `execute()`.

## Reuse

The engine accepts domain contracts rather than query-specific functions.
Every catalog query uses the same projection path. Query and projection caches
key results by tenant, business, semantic version, query, pagination, and
stable parameters.
