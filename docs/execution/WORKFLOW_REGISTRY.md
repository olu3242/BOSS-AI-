# Workflow Registry

Certification date: 2026-06-27

The readonly `workflowRegistry` contains six existing definitions. IDs and
names are unchanged.

| ID | Owner | Trigger | Agents | Events | Automations | Status |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `lead_follow_up_recovery` | Sales | `event` | 1 | 3 | 0 | Draft |
| `appointment_reminder` | Operations | `schedule` | 2 | 3 | 0 | Draft |
| `customer_re_engagement` | Customer Success | `schedule` | 1 | 3 | 0 | Draft |
| `invoice_follow_up` | Finance | `schedule` | 1 | 3 | 0 | Draft |
| `review_request` | Customer Success | `event` | 1 | 3 | 0 | Draft |
| `administrative_automation` | Operations | `manual` | 2 | 3 | 0 | Draft |

Every definition includes stable identity, agent/capability/prompt references,
trigger and event IDs, KPI links, ownership, version, lifecycle status,
timeout, retry, failure, documentation, and tags. Retry remains one attempt
with no strategy, and timeout remains unknown because no runtime exists.

Validation: six unique IDs, zero broken references, zero renamed workflows.
