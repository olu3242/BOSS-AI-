# BOSS Business Graph

The canonical relationship model. This graph is the source of truth for
how entities in `docs/architecture/BUSINESS_ONTOLOGY.md` relate; no
module may model a competing relationship structure.

```
Organization
    owns
Business

Business
    has
Customers

Business
    has
Employees

Business
    has
Constraints

Constraints
    affect
KPIs

KPIs
    drive
Recommendations

Recommendations
    activate
Workflows

Workflows
    execute
AI Employees

AI Employees
    emit
Events

Events
    update
Business Timeline

Business Timeline
    updates
Business Health

Business Health
    generates
Continuous Optimization
```

This relationship graph maps directly onto the bounded contexts in
`docs/architecture/ARCHITECTURE.md` §2 — e.g. "Constraints affect KPIs"
is owned jointly by the Business context (constraints) and Analytics
context (KPIs), connected via the MCP knowledge layer, never by direct
cross-context table access.
