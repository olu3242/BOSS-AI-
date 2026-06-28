# Registry Health Report

Certification date: 2026-06-27

| Registry | Entries | Readonly | Unique IDs | Missing owners | Broken refs |
| --- | ---: | --- | ---: | ---: | ---: |
| Agent | 7 | Yes | 0 | 0 | 0 |
| Capability | 15 | Yes | 0 | 0 | 0 |
| Workflow | 6 | Yes | 0 | 0 | 0 |
| Event | 20 | Yes | 0 | 0 | 0 |
| Trigger | 3 | Yes | 0 | 0 | 0 |
| Automation | 0 | Yes | 0 | 0 | 0 |
| Orchestrator | 0 | Yes | 0 | 0 | 0 |

## Static Analysis

- Duplicate graph IDs: 0
- Broken mappings: 0
- Cyclic dependencies: 0
- Unused prompts: 0
- Missing workflow/event/trigger references: 0
- Missing automation references: 0; no references exist
- Empty execution areas: automation, notification, integration, orchestrator

The graph has 26 known orphan nodes. These are catalog definitions not yet
connected to an execution path and are documented in `DEPENDENCY_GRAPH.md`.

Health status: **Structurally valid with declared execution gaps**.
