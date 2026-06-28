# Lifecycle Model

Certification date: 2026-06-27

The readonly lifecycle registry contains 15 states.

| Entity | States | Terminal states |
| --- | --- | --- |
| Agent | Draft, Available, Deprecated, Disabled | Deprecated, Disabled |
| Capability | Active, Deprecated, Disabled | Deprecated, Disabled |
| Workflow | Draft, Active, Deprecated, Disabled | Deprecated, Disabled |
| Registry | Registered, Deprecated | Deprecated |
| Policy | Active, Deprecated | Deprecated |

Allowed transitions are declarative ID references. All transition targets
resolve, and current agent, capability, workflow, policy, and governance states
map to registered lifecycle definitions.

This model does not transition a runtime object or deploy an agent.
