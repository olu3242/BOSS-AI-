# SMB Agent Catalog

Certification date: 2026-06-27

## Registry Schema

The readonly `agentRegistry` contains seven normalized `Agent` records. Each
record preserves the Batch 1 `key`, `label`, `responsibilities`,
`capabilities`, `executionModes`, and reference fields while adding the Batch 2
business metadata schema.

| Field group | Fields |
| --- | --- |
| Identity | `id`, `displayName`, `key`, `label` |
| Classification | `department`, `businessDomain`, `primaryRole`, `secondaryRoles`, `tags` |
| Outcomes | `mission`, `businessOutcome`, `businessObjectives`, `coreResponsibilities` |
| Measurement | `primaryKPIs`, `secondaryKPIs`, `priority`, `owner` |
| Applicability | `supportedIndustries`, `supportedBusinessSizes`, `supportedChannels` |
| Operation metadata | `executionMode`, `activationConditions`, `dependencies`, `requiredCapabilities` |
| Estimates | `estimatedExecutionTime`, `estimatedOperationalCost` |
| Communication | `notificationChannels`, `escalationTargets` |
| References | `prompts`, `workflows`, `automations`, `events`, `triggers`, `documentation` |
| Governance | `version`, `status`, `registrationState`, `deploymentState`, `lifecycle`, `health`, `registry` |

All fields are readonly TypeScript properties. Registry snapshots and
registered top-level records are frozen.

## Classification Matrix

| Agent | Department | Business domain | Primary role | Priority | Owner |
| --- | --- | --- | --- | --- | --- |
| CEO Advisor | Executive | Business Strategy | Executive Advisor | Critical | Business Owner |
| AI Front Desk | Support | Customer Operations | Inbound Service Coordinator | High | Business Owner |
| AI Follow-Up Assistant | Sales | Lead Engagement | Follow-Up Coordinator | High | Business Owner |
| AI Operations Coordinator | Operations | Business Operations | Operations Coordinator | High | Business Owner |
| AI Review Manager | Customer Success | Reputation Management | Review Manager | Medium | Business Owner |
| AI Collections Assistant | Finance | Accounts Receivable | Collections Coordinator | High | Business Owner |
| AI Reporting Analyst | Analytics | Business Analytics | Reporting Analyst | Medium | Business Owner |

## Department Matrix

| Department | Agent count | Agents |
| --- | ---: | --- |
| Executive | 1 | CEO Advisor |
| Operations | 1 | AI Operations Coordinator |
| Sales | 1 | AI Follow-Up Assistant |
| Finance | 1 | AI Collections Assistant |
| Customer Success | 1 | AI Review Manager |
| Support | 1 | AI Front Desk |
| Analytics | 1 | AI Reporting Analyst |
| Marketing | 0 | None |
| Compliance | 0 | None |
| Administration | 0 | None |
| Knowledge | 0 | None |
| Automation | 0 | None |

Additional classifications use tags and business domains; no extra department
values were introduced.

## Reference Model

- Prompt references contain the existing prompt ID and `unversioned`, because
  the current prompt registry has no version field.
- Workflow references contain only existing workflow IDs.
- Trigger references contain only `manual`, `event`, or `schedule`, derived
  from referenced workflow definitions.
- Event references contain the existing agent lifecycle event IDs.
- Automation references remain empty because no automation registry exists.
- Prompt text remains solely in the prompt registry and is not duplicated.

## Field Definitions

| Field | Definition |
| --- | --- |
| `department` | One allowed primary organizational department. |
| `businessDomain` | The business problem space served by the agent. |
| `primaryRole` | The agent's principal business role. |
| `businessOutcome` | The observable business result the role supports. |
| `businessObjectives` | Specific objectives derived from the existing mission and responsibilities. |
| `primaryKPIs` | The first existing KPI assigned to the legacy AI employee. |
| `secondaryKPIs` | Remaining existing KPI assignments. |
| `executionMode` | Trigger modes derived from referenced workflows; empty when no workflow exists. |
| `activationConditions` | Declarative workflow references; not executable conditions. |
| `estimatedExecutionTime` | Unknown until a runtime records execution telemetry. |
| `estimatedOperationalCost` | Unknown until a provider/runtime records cost telemetry. |
| `registrationState` | `registered` for all catalog records. |
| `deploymentState` | `not_deployed`; PI-2 does not deploy agents. |
| `status` | `defined`; distinct from the preserved lifecycle value `draft`. |

## Backward Compatibility

- Existing AI employee names and keys are unchanged.
- `aiEmployeeRegistry` remains available and is seeded from the same
  `aiEmployees` constant.
- Batch 1 fields remain available. Normalized fields use `id` and
  `displayName`; `key` and `label` remain compatibility aliases.
- Existing prompts, workflows, events, APIs, UI code, and runtime contracts
  were not modified.

## Validation Summary

| Check | Result |
| --- | --- |
| Registry entries | 7 unique IDs and display names |
| Readonly surface | Frozen list snapshots and top-level records |
| Required owners | 7 of 7 present |
| Required departments | 7 of 7 present and allowed |
| Lifecycle values | 7 of 7 present |
| Prompt references | All resolve to existing prompt IDs |
| Workflow references | All resolve to existing workflow IDs |
| Trigger references | All use discovered trigger IDs |
| Automation references | No references and no automation registry |
| Circular agent dependencies | None; all agent dependency lists are empty |
| Typecheck | Passed for registries and general-SMB packages |
| Lint | Passed for registries and general-SMB packages |
| Affected tests | 10 of 10 passed |

## Known Limitations

- Prompts are not versioned by their source registry, so references explicitly
  use `unversioned`.
- Execution time and operational cost remain unknown until runtime telemetry
  exists.
- Notification channels and automation references remain empty because no
  corresponding registries exist.
- The AI Reporting Analyst has no existing workflow or trigger reference.
- Metadata classification is declarative and does not activate, deploy, or
  authorize an agent.
