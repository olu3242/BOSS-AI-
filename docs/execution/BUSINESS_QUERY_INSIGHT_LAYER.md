# Business Query & Insight Layer

## Purpose

The Business Query & Insight Layer (BQIL) is the canonical read boundary for
the Business Knowledge Platform. It accepts registered business queries and
returns deterministic, version-aware projections, views, factual insights, and
execution metadata.

```text
Business Semantic Layer
          |
          v
 Business Query Service
    |       |       |
 Catalog  Projection  Factual Insights
    |       |       |
    +-------+-------+
            |
       Query Result
```

BQIL consumes only `BusinessSemanticLayer`. It has no Graph Runtime,
repository, diagnostics, scoring, recommendation, planning, or strategy
dependency.

## Public Contract

`BusinessQueryService` exposes:

- `execute(request): Promise<QueryResult>`
- `stream(request): AsyncIterable<BusinessProjectionItem>`
- `catalog(): readonly QueryDefinition[]`
- `performance(): BqilPerformance`

Requests contain a registered query ID, tenant, business, optional graph
version, cursor, limit, parameters, and traced execution context. Results pin
query, semantic, graph, and discovery versions.

## Consumer Boundary

Workflow and Agent Runtime preflight execute the registered
`execution_context` query. The previous Semantic and Graph guard names remain
deprecated compatibility aliases backed by BQIL.

Dependency-cruiser prevents downstream API services from importing Semantic
Layer internals. Graph and Semantic infrastructure remain available only to
their approved layers and the composition root.

Legacy intelligence APIs remain for backward compatibility, but are not
approved for new Business Knowledge Platform consumers.

## Tenant and Audit Controls

BQIL validates request tenant identity before semantic resolution. Semantic
Layer, Graph Runtime, and Business Context repeat tenant validation. Every
successful query emits traced events and writes a durable audit record through
the shared audit sink.
