# BOSS Engineering Principles

## Purpose

These principles translate the Execution Constitution into implementation
behavior.

## Standard

- Build one Epic -> Capability -> Batch -> Certification unit at a time.
- Map business entities and lifecycle changes to the Canonical Business Model.
- Prefer existing contracts, registries, runtimes, evidence, and telemetry.
- Keep business knowledge out of runtime infrastructure.
- Keep execution out of intelligence and presentation layers.
- Make tenant, authorization, policy, evidence, and trace context explicit.
- Use immutable, versioned contracts at bounded-context boundaries.
- Reject missing dependencies and unsupported states; never guess.
- Preserve backward compatibility until migration is certified.
- Implement real behavior before customer-facing UI.
- Record limitations as debt, not as implied completion.

## Required Change Statement

Every batch documents:

- Business problem and intended outcome.
- Constitutional capability: Observe, Understand, Decide, Plan, Execute, or
  Learn.
- Upstream certified dependencies.
- Canonical state owner.
- Canonical Business Model entities and relationships affected.
- Execution path and evidence path.
- Permissions, approvals, tenant isolation, and failure behavior.
- Metrics and Time to First Business Value impact.
- Validation and certification decision.

## Prohibited Patterns

- Parallel execution engines or duplicated orchestration.
- Raw source-to-action shortcuts.
- Duplicate business state or private agent memory presented as business truth.
- Recommendations without evidence and confidence.
- Learning from unverified or synthetic outcomes.
- Placeholder dashboards, static health scores, mock metrics, or demo execution
  presented as operational.
- Higher-level capabilities consuming uncertified lower-level contracts.
