# Governance Model

Certification date: 2026-06-27

The readonly `governanceRegistry` contains four controls.

| Control | Owner | Risk | Policy mapping |
| --- | --- | --- | --- |
| `registry.change_control` | Governance | High | Workflow execution approval |
| `registry.reference_integrity` | Platform | High | Tenant isolation |
| `registry.ownership` | Governance | Medium | Owner escalation |
| `registry.lifecycle` | Governance | Medium | Workflow execution approval |

## Rules

1. Stable IDs and versions are immutable identity metadata.
2. Changes require pull-request review and executable evidence.
3. Cross-registry references must resolve before certification.
4. Every populated governed record requires an owner and documentation.
5. Lifecycle transitions must resolve to registered lifecycle IDs.
6. Governance metadata never grants runtime execution authority.

All four policy mappings and lifecycle mappings resolve.
