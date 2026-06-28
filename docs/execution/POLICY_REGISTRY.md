# Policy Registry

Certification date: 2026-06-27

The readonly policy registry preserves five existing IDs and adds normalized
ownership, approval, risk, change-control, lifecycle, documentation, version,
and tags.

| ID | Category | Owner | Approval | Risk |
| --- | --- | --- | --- | --- |
| `approval.workflow_execution` | Approval | Governance | Human required | High |
| `security.tenant_isolation` | Security | Security | Human required | High |
| `privacy.pii_handling` | Privacy | Security | Human required | High |
| `execution.token_budget` | Execution | Platform | Human required | Medium |
| `escalation.owner_notification` | Escalation | Governance | Human required | Medium |

All policies use pull-request change control, version `1.0.0`, and active
lifecycle status. Policy metadata does not enforce runtime authorization.

Validation: five unique IDs, five owners, zero missing lifecycle mappings.
