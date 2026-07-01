# Business Diagnostic Engine Integration Report

## Inputs

- Completed Business MRI
- Business profile and DNA
- Persisted health dimensions
- Persisted business capability assessments
- Constraint findings and priorities
- Evidence-backed recommendation candidates and priorities
- Versioned diagnostic weight profile

## Ownership Boundaries

| Context | Responsibility |
| --- | --- |
| Discovery | Facts and canonical business context |
| MCP Health | Dimension scoring |
| Constraint Intelligence | Root-cause candidates and evidence |
| Recommendation catalog | Diagnostic improvement candidates |
| Diagnostic Engine | Canonical synthesis, maturity, priority and summary |
| EP04 BPI | Strategy and Business Outcome Plans |
| EP05 BEPE | Execution blueprint design |
| Loop | Workflow, agent and automation execution |

## Security

- Generation rejects mismatched execution and organization context.
- Every repository read and write includes `orgId`.
- Diagnostic tables carry RLS policies.
- IDs alone are never treated as tenant authorization.
- External HTTP access remains blocked until centralized authorization is
  integrated.

## Dashboard

`buildDiagnosticDashboard()` consumes only a persisted
`BusinessDiagnosticReport`. It sorts persisted priorities and exposes overall
health, category health, issues, opportunities, maturity and next step without
performing diagnosis in the UI.

## Backward Compatibility

- No existing table is modified.
- Existing API members remain unchanged.
- Existing health, constraint and recommendation outputs remain valid.
- Four additive event definitions use the current event naming and context.
- No workflow, agent, automation or runtime contract changed.
