# Query Catalog

## Contract

`businessQueryRegistry` is readonly. Each entry defines a stable query ID,
display name, description, category, projection kind, semantic view, entity
and relationship scope, owner, version, and lifecycle.

## Canonical Queries

| Category | Query ID | Projection |
| --- | --- | --- |
| Executive | `organization_summary` | Context |
| Executive | `executive_dashboard` | Aggregate |
| Executive | `kpi_summary` | KPI |
| Operations | `department_overview` | Entity |
| Operations | `workflow_summary` | Entity |
| Operations | `automation_summary` | Entity |
| Customers | `customer_portfolio` | Entity |
| Customers | `customer_relationships` | Relationship |
| Customers | `customer_activity` | Aggregate |
| Business | `revenue_summary` | Aggregate |
| Business | `team_summary` | Entity |
| Business | `ai_operations_summary` | Aggregate |
| Business | `compliance_summary` | Entity |
| Platform | `execution_context` | Context |

Extensions use the `extension:<name>` namespace and must register before
execution. Unknown, disabled, or deprecated query IDs fail closed.

## Versioning

The initial catalog is version `1.0.0`. Query executions record the exact
query, semantic, graph, and discovery versions needed for reproducibility.
Changing projection semantics requires a query version change.
