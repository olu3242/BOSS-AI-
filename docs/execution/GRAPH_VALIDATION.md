# Graph Validation

## Validation Flow

`validateGraphSnapshot` performs a read-only structural scan of one immutable
snapshot. It reports:

- orphan nodes
- circular `depends_on` relationships
- unregistered relationship types
- duplicate edge IDs or signatures
- missing ownership on operational nodes
- edge references to missing nodes

Errors make a report invalid. Orphans and missing owners are warnings, allowing
draft graph quality to be measured without silently treating incomplete data
as corruption.

## Determinism

Dependency cycle detection walks nodes and edges in stable ID order. Issues are
sorted by code and entity ID. Validation never writes graph data and never
performs business diagnosis.

## Evidence

Tests provide a deliberately malformed snapshot containing a dependency cycle,
duplicate edge ID, broken endpoint, and missing owners. The report detects each
class and returns `valid: false`.
