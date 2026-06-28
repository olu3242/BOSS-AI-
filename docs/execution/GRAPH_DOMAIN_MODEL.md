# Graph Domain Model

## Aggregate

`GraphSnapshot` is the immutable representation of one graph version:

```text
GraphSnapshot
  graphId, orgId, businessId
  version, lockVersion, status
  sourceDiscoveryVersion
  metadata
  nodes[]
  edges[]
```

`BusinessNode` identifies a typed business entity. `BusinessEdge` connects two
nodes using a registered relationship ID. `GraphMetadata` records provenance,
source version, optional owner, and extension data.

## Lifecycle

```text
draft -> published -> archived
```

Content changes and lifecycle transitions each create a new immutable graph
version. Archived graphs reject content mutations. Optimistic concurrency uses
`lockVersion`; stale writes fail rather than overwrite newer graph state.

## Node Taxonomy

The initial taxonomy covers organizations, business units, departments, teams,
users, customers, vendors, products, services, revenue streams, projects,
tasks, documents, workflows, automations, AI agents, KPIs, objectives,
policies, and integrations.

## Relationship Taxonomy

The centralized definitions are `owns`, `manages`, `belongs_to`, `depends_on`,
`serves`, `produces`, `supports`, `integrates_with`, `executes`, `measures`,
and `governed_by`. Definitions are versioned independently from graph
instances.

## Integrity

Writes require unique node IDs, unique edge IDs and signatures, registered
relationship types, and endpoints present in the same tenant graph.
