# Capability Registry

Certification date: 2026-06-27

## Executive Summary

Batch 3 normalizes all 15 existing general-SMB capabilities in the existing
`capabilityRegistry`. No capability was renamed, removed, duplicated, or wired
to runtime behavior. All seven agents reference capabilities by normalized ID.

## Capability Schema

| Group | Fields |
| --- | --- |
| Identity | `id`, `name`, `displayName`, `key`, `label` |
| Definition | `description`, `category`, `subcategory`, `businessDomain` |
| Applicability | `supportedIndustries` |
| Contract metadata | `requiredInputs`, `generatedOutputs`, `dependencies`, `requiredPermissions` |
| Execution metadata | `executionMode`, `riskLevel`, `complexity` |
| Governance | `owner`, `version`, `status`, `tags` |

`id`, `name`, and `displayName` are normalized fields. Existing `key` and
`label` fields remain compatibility aliases. Registry list snapshots and
top-level capability records are frozen and typed readonly.

## Capability Catalog

| ID | Display name | Category | Subcategory | Domain | Owner | Risk | Complexity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `sales` | Sales | Sales | Pipeline | Revenue Growth | Sales | Medium | Medium |
| `marketing` | Marketing | Marketing | Campaigns | Demand Generation | Marketing | Medium | Medium |
| `lead_management` | Lead Management | CRM | Leads | Lead Engagement | Sales | Medium | Medium |
| `customer_management` | Customer Management | CRM | Customers | Customer Operations | Customer Success | Medium | Medium |
| `scheduling` | Scheduling | Scheduling | Appointments | Business Operations | Operations | Medium | Medium |
| `operations` | Operations | Operations | Service Delivery | Business Operations | Operations | Medium | High |
| `communication` | Communication | Communications | Customer Messaging | Customer Operations | Customer Success | Medium | Medium |
| `reviews` | Reviews | Customer Success | Reputation | Reputation Management | Customer Success | Medium | Low |
| `finance` | Finance | Finance | Financial Management | Financial Operations | Finance | High | High |
| `billing` | Billing | Finance | Accounts Receivable | Accounts Receivable | Finance | High | Medium |
| `reporting` | Reporting | Reporting | Business Reporting | Business Analytics | Analytics | Low | Medium |
| `task_management` | Task Management | Operations | Work Management | Business Operations | Operations | Low | Medium |
| `documents` | Documents | Documents | Business Documents | Knowledge Management | Administration | High | Medium |
| `notifications` | Notifications | Notifications | Alerts | Business Operations | Operations | Medium | Low |
| `team_collaboration` | Team Collaboration | Operations | Collaboration | Business Operations | Operations | Low | Low |

## Agent-to-Capability Matrix

| Agent | Capability IDs |
| --- | --- |
| CEO Advisor | `reporting`, `operations` |
| AI Front Desk | `communication`, `lead_management` |
| AI Follow-Up Assistant | `lead_management`, `communication` |
| AI Operations Coordinator | `operations`, `scheduling`, `task_management` |
| AI Review Manager | `reviews` |
| AI Collections Assistant | `billing`, `finance` |
| AI Reporting Analyst | `reporting` |

Agent mappings cover 9 of 15 catalog capabilities. The six capabilities not
currently assigned to an agent are `sales`, `marketing`,
`customer_management`, `documents`, `notifications`, and
`team_collaboration`. They are existing shared platform capabilities used by
other declarative business definitions or reserved for future agent mappings;
Batch 3 does not invent assignments.

## Category Definitions

| Category | Purpose |
| --- | --- |
| Sales | Pipeline and revenue conversion capabilities. |
| Marketing | Demand generation and brand activity. |
| CRM | Lead and customer relationship records. |
| Scheduling | Appointment and resource coordination. |
| Operations | Service delivery and internal work coordination. |
| Communications | Customer-facing message exchange. |
| Customer Success | Retention, feedback, and reputation activity. |
| Finance | Financial management, invoicing, and collection. |
| Reporting | Business performance presentation. |
| Documents | Business document and record handling. |
| Notifications | Staff and customer alerts. |

The wider category type also reserves the requested enterprise classifications
without creating capabilities in those categories.

## Reuse Strategy

- Capability definitions live once in `capabilityRegistry`.
- Agents store `{ id, key }` references and do not duplicate capability
  descriptions or governance metadata.
- Required permissions are derived from existing AI employee capability and
  permission assignments.
- Shared capability IDs can be referenced by multiple agents, constraints,
  recommendations, and future workflows.
- Empty dependency arrays avoid unsupported relationships and guarantee an
  acyclic Batch 3 graph.

## Backward Compatibility

- `capabilityRegistry`, `CapabilityEntry`, `key`, `label`, `description`,
  `list()`, `get()`, and `register()` remain available.
- All 15 existing keys and labels are unchanged.
- Existing AI employee capability arrays remain unchanged.
- The normalized agent field `requiredCapabilities` mirrors the compatibility
  `capabilities` field.
- No API, UI, workflow, orchestrator, queue, database, or runtime file changed.

## Validation Results

| Check | Result |
| --- | --- |
| Existing capability coverage | 15 of 15 normalized |
| Unique IDs | 15 of 15 |
| Unique names | 15 of 15 |
| Missing owners | 0 |
| Invalid agent mappings | 0 |
| Invalid dependency references | 0 |
| Cyclic dependencies | 0 |
| Agent capability coverage | 7 of 7 agents |
| Agent-mapped catalog coverage | 9 of 15 capabilities |
| Affected tests | 14 of 14 passed |
| Package typecheck | Passed |
| Package lint | Passed with zero warnings |

## Known Limitations

- Required input and generated output contracts are empty because existing
  definitions do not specify stable data contracts.
- Six existing capabilities are not assigned to an AI employee.
- Capability dependencies are empty because no explicit dependency graph
  exists yet.
- Categories and execution modes are declarative metadata and are not consumed
  by a runtime.
- Permission metadata reflects existing AI employee assignments only; it is
  not an authorization policy.

## Recommended Batch 4

Inventory and normalize the existing workflow, event, trigger, and automation
definitions while preserving all current identifiers and runtime boundaries.
