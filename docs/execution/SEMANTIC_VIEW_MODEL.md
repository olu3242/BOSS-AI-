# Semantic View Model

## Registry

`semanticViewRegistry` is readonly and defines eight versioned projections:

- Executive
- Operations
- Sales
- Marketing
- Finance
- Customer Success
- AI Operations
- Automation

Each definition contains a stable ID, display name, description, included
entity types, allowed relationship types, owner, version, and lifecycle
status. Extensions use `extension:<name>` IDs.

## Projection

A view filters an immutable Semantic Context by registered entity types, then
retains only relationships whose endpoints are both visible and whose type is
allowed. It calculates factual entity counts only.

```text
Semantic Context + registered projection
  -> filtered entities
  -> endpoint-safe relationships
  -> entity counts
  -> immutable, version-pinned Semantic View
```

Views contain semantic and graph versions and are cached by tenant, business,
graph version, and view ID. They contain no health scores, findings,
recommendations, or inferred relationships.

## Versioning

Projection definitions have independent semantic versions. Generated views
pin the graph and semantic versions used to construct them, preserving
reproducibility after later graph updates.
