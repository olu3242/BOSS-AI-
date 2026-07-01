# Trigger Registry

Certification date: 2026-06-27

| ID | Workflows | Event IDs | Owner |
| --- | ---: | ---: | --- |
| `manual` | 1 | 0 | Automation |
| `event` | 2 | 0 | Automation |
| `schedule` | 3 | 0 | Automation |

The three existing trigger identifiers are normalized in a readonly registry.
Workflow mappings are complete. Event IDs remain empty because no concrete
entry-event contract exists, and `schedule` is metadata only: no scheduler or
cron job was introduced.

Validation: three unique IDs, six workflow mappings, zero broken references.
