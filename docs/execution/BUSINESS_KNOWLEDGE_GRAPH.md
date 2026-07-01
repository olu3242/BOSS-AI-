# Business Knowledge Graph

## Scope

The Business Knowledge Graph (BKG) is the tenant-scoped, versioned relationship
layer derived from published Canonical Business Context. It stores business
entities and explicit relationships. It does not infer facts, diagnose the
business, recommend actions, or execute work.

```text
Canonical Business Context
          |
          v
BusinessGraphService
          |
          +-- normalized current nodes and edges
          +-- immutable snapshots
          +-- append-only history
          +-- domain events and audit records
          |
          v
Graph Runtime
```

## Authoritative Contracts

- Domain types: `packages/types/src/businessGraph.ts`
- Relationship taxonomy:
  `packages/registries/src/registries/businessRelationship.ts`
- Repository contract: `packages/db/src/repositories/types.ts`
- PostgreSQL schema: `packages/db/migrations/0023_business_knowledge_graph.sql`
- Foundation service: `apps/api/src/services/businessGraphService.ts`

The initial 21 canonical node types and 11 relationship types are stable IDs.
Extensions use the `extension:<name>` namespace and must register their
relationship definition before persistence.

## Tenant and Audit Controls

Every aggregate, node, edge, snapshot, and history row carries `org_id`.
PostgreSQL RLS uses `boss_current_org_id()` on all five graph tables. Service
mutations reject an execution context whose organization does not match the
target tenant. Every mutation records actor, reason, correlation ID, and trace
ID.

## Registry Integration

The feature, runtime, event, policy, and relationship registries contain the
graph contracts. Registered services are:

- `business_knowledge_graph`
- `business_graph_repository`
- `graph_resolution_engine`
- `graph_runtime`
- `graph_traversal_service`
- `graph_validation_service`
- `graph_cache`

## Validation Evidence

`businessGraphRuntime.test.ts` proves graph projection, version history,
optimistic concurrency boundaries, tenant denial, relationship resolution,
runtime mediation, events, and audit records. `migrations.test.ts` verifies the
normalized schema and RLS declarations.

## Limitations

The PostgreSQL migration requires validation against a configured live
database. Batch 1 does not include inference, recursive runtime traversal,
caching, semantic views, diagnostics, or recommendations.
