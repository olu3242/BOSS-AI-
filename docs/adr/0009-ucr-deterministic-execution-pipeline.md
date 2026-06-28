# ADR 0009: UCR Deterministic Execution Pipeline

- Status: Accepted
- Date: 2026-06-28

## Context

UCR Batch 1 established execution contracts and state control but deliberately
could not execute Capability Packs. A single ordered path is required before
business capabilities can safely integrate.

## Decision

Implement one twelve-stage sequential pipeline in `@boss/loop`. Registry-backed
adapters resolve capability, manifest, dependency, runtime, and feature
metadata. A caller-supplied `CapabilityExecutor` is the only extension point
that performs capability behavior.

Every stage implements initialize, validate, execute, complete, and cleanup.
The coordinator owns order, timing, stage events, pipeline events, and failure
location. UCR owns execution state and session finalization.

## Consequences

- Capability execution has one deterministic entry path.
- Runtime code remains business-agnostic.
- Dependency cycles, missing metadata, incompatible versions, and unavailable
  runtime features fail closed.
- Results and evidence are persisted through injectable interfaces.
- Retry, replay, rollback, checkpoints, scheduling, concurrency, and resource
  management remain out of scope.
