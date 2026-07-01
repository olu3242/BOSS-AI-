# Event Registry

Certification date: 2026-06-27

The readonly `eventRegistry` contains all 20 existing canonical event IDs.

| Category | Count | Ownership |
| --- | ---: | --- |
| Organization | 1 | Platform |
| Business | 4 | Operations |
| Audit | 2 | Compliance |
| Constraint | 2 | Operations |
| Recommendation | 1 | Executive |
| Workflow | 4 | Automation |
| Agent | 3 | Automation |
| Notification | 1 | Operations |
| KPI | 1 | Analytics |
| Dashboard | 1 | Analytics |

Each event includes stable identity, category, publisher/subscriber indexes,
owner, version, status, risk, documentation, and tags. Publisher and subscriber
lists remain empty because `packages/events` defines only interfaces; no
publisher or subscriber implementation was discovered.

Workflow definitions reference `workflow.started`, `workflow.completed`, and
`workflow.failed`. No event was renamed or emitted by this change.
