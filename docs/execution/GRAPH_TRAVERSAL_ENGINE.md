# Graph Traversal Engine

## Algorithms

Direct traversal resolves parents and children from incoming and outgoing
edges. Recursive traversal uses breadth-first search with a visited set:

- `ancestors`: recursive incoming traversal
- `descendants`: recursive outgoing traversal
- `dependencies`: outgoing `depends_on` targets
- `dependents`: incoming `depends_on` sources
- `ownership`: incoming `owns`, `manages`, or `belongs_to`
- `impactChain`: transitive dependencies and dependents

Neighbors and result sets are sorted by stable node ID. Cycles terminate at the
visited set. Every operation executes against the immutable snapshot held by a
`GraphSession`, making results version-aware and reproducible.

## Contract

Traversal throws for an unknown starting node and never crosses tenant or graph
boundaries. It does not infer missing edges or rank results.

## Evidence

`businessGraphRuntime.test.ts` proves deterministic dependency and ancestor
resolution against a published tenant graph and verifies traversal telemetry
events.
