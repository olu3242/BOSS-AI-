# ADR 0008: Universal Capability Runtime Core

- Status: Accepted
- Date: 2026-06-28

## Context

Capability Packs need one capability-agnostic execution contract. Adding a
runtime per business domain would duplicate lifecycle, context, errors, events,
and telemetry while coupling the Platform Kernel to business knowledge.

## Decision

Define immutable UCR contracts in `@boss/types` and implement the core state
machine, registry adapters, typed errors, lifecycle events, and telemetry shell
in `@boss/loop`. UCR consumes CPP manifests and readonly registries but does not
load or execute pack code in Batch 1.

The Batch 2 pipeline remains registered as `planned`. Existing specialized
runtimes remain backward-compatible infrastructure until separately governed
migration.

## Consequences

- Every future Capability Pack receives one context and state model.
- Invalid transitions, missing metadata, dependencies, and permissions fail
  with typed errors.
- Runtime events and telemetry share tenant, correlation, and trace context.
- Persistence, pipeline stages, retries, scheduling, replay execution, and
  business capability execution remain out of scope.
