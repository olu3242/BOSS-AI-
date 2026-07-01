# Dependency Resolution

## Service

`DependencyResolutionService` translates business-oriented dependency requests
into Graph Runtime traversal and maps results back to semantic entities.
Traversal logic is not duplicated in the Semantic Layer.

| Semantic request | Graph Runtime operation |
| --- | --- |
| Ownership | ownership traversal |
| Responsibility | incoming `manages` and `supports` |
| Operational dependencies | outgoing `depends_on` |
| Business dependencies | outgoing `depends_on` |
| Policy scope | outgoing `governed_by` |
| Execution scope | bidirectional `executes`, `supports`, `integrates_with` |

The result contains the source semantic entity, sorted related semantic
entities, semantic version, and graph version.

## Determinism

Graph Runtime owns direction, filtering, caching, stable ordering, and
version-pinning. BSL only converts semantic IDs at its private boundary.
Unknown semantic IDs fail rather than falling back to direct graph access.

## Evidence

The semantic integration test proves ownership, business dependencies, and AI
execution scope against one published graph version, including semantic-only
result contracts.
