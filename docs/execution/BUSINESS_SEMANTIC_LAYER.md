# Business Semantic Layer

## Purpose

The Business Semantic Layer (BSL) is the anti-corruption boundary between
Business Knowledge Graph infrastructure and application consumers. It converts
a version-pinned Graph Runtime session plus the matching Canonical Business
Context version into stable business semantics.

```text
Canonical Business Context ----+
                               |
Business Knowledge Graph       |
          |                    |
          v                    v
      Graph Runtime -> Business Semantic Layer
                              |
              +---------------+---------------+
              |               |               |
       Context Resolution  Semantic Views  Dependency Resolution
```

The BSL does not diagnose, score, recommend, plan, prioritize, infer, or
execute. No graph IDs, graph snapshots, graph nodes, or graph edges appear in
its public domain contracts.

## Semantic Contract

`BusinessSemanticContext` contains tenant and business identity, semantic,
graph, and discovery versions, lifecycle, the organization, semantic entities,
semantic relationships, schema version, and generation time.

Semantic versions equal their source graph versions. Semantic IDs use a stable
namespace independent from graph contracts. Historical requests pin the graph
version and return `historical`; archived source graphs return `archived`.

## Consumer Boundary

Workflow and Agent Runtime preflight use `BusinessSemanticExecutionGuard`.
Agent retrieval uses `BusinessSemanticAgentProvider`. Future graph-aware
automation handlers must use the same semantic service.

Canonical Business Context is intentionally upstream of graph construction and
BSL. Requiring it to consume BSL would create a circular dependency and is not
allowed. Graph Service, Graph Runtime, BSL, tests, and the API composition root
are the approved graph-infrastructure consumers. Dependency-cruiser enforces
this application boundary.

## Observability and Audit

Semantic loads, resolutions, views, and invalidations emit tenant, semantic
version, graph version, correlation ID, trace ID, and timestamp. Loads,
context resolutions, and view creation are written through the shared audit
sink.

## Scope Status

Batch 3 is Engineering Complete after repository validation. BQIL,
Diagnostics, Health, Gap Analysis, Strategy, and AI reasoning remain outside
this batch.
