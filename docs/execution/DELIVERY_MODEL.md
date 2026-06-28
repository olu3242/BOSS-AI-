# BOSS Delivery Model

BOSS delivery follows:

```text
Epic
  -> Capability
    -> Batch
      -> Certification
```

One execution prompt may implement only one batch. A dependent batch begins
only after its prerequisite has a recorded certification decision.

Each batch must:

1. name its bounded context and customer or platform outcome;
2. preserve public contracts unless a migration path is approved;
3. include focused executable tests;
4. pass typecheck, lint, tests, build, and architecture gates;
5. record evidence, risks, environmental blockers, and a decision.

For OC2.3, Diagnostics, Strategy, Planning, Prioritization, Resource
Allocation, Decision Support, Readiness, and Command Center are eight separate
batches. They must not be combined into one implementation prompt.
