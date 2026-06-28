# ADR 0007: Shared Capability Pack Platform

- Status: Accepted
- Date: 2026-06-28

## Context

BOSS needs installable implementation artifacts without adding lifecycle,
security, dependency, and compatibility code to each business capability.
Business Capabilities remain the product architecture; packs are their
implementation artifacts.

## Decision

Introduce `@boss/capabilities` with one manifest, signature, compatibility,
dependency, release, and tenant-installation lifecycle for all supported pack
types. Publish immutable pack metadata through readonly Pack and Marketplace
registries. Keep execution outside CPP and preserve the Execution Backbone.

## Consequences

- New pack types do not require lifecycle infrastructure changes.
- Trusted signatures, tenant checks, permissions, dependency checks, rollback,
  events, and audit are consistent.
- Existing runtime and registry contracts remain backward compatible.
- The default implementation is process-local and not Production Ready.
- UCR, SDK, Governance, bundles, and Business Capability Lifecycle enforcement
  remain separately certified capabilities.
