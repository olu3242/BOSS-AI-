# ADR-0002: Registry-driven capability packs over hardcoded industry logic

**Status:** accepted
**Date:** 2026-06-26

## Context

CLAUDE.md prohibits hardcoding industry-specific logic. The platform
needs a first capability pack to prove generality across very different
small businesses (salon, cleaning company, tutoring center, etc.)
without special-casing any one of them.

## Decision

Introduce eight declarative registries in `packages/registries`
(capability, constraint, KPI, AI employee, workflow, prompt, policy,
event), each backed by a generic, in-memory `createRegistry()` factory
that enforces unique keys and read-only access outside of `register()`.
Platform-wide contracts (events, policies) are seeded directly in
`packages/registries/src/seed`. Pack-specific knowledge (capabilities,
constraints, KPIs, AI employees, workflows, prompts) is seeded by
`industry-packs/general-smb`, the first Core Business Capability Pack,
via `installGeneralSmbPack()`.

## Consequences

- Adding a new vertical pack means writing new `industry-packs/<name>`
  data files that call the same registry APIs — no platform code changes.
- Cross-references between registries (e.g. a workflow's
  `relatedConstraints`) are validated by tests
  (`industry-packs/general-smb/src/__tests__`), not by convention.
- The registries currently hold metadata only (no execution semantics);
  Loop Runtime and MCP will read from them once workflow/agent execution
  is implemented in a later goal.

## Alternatives Considered

- Industry-specific modules with hardcoded `if (industry === "salon")`
  branches: rejected — directly violates CLAUDE.md and does not scale to
  "every small business in the world."
- A single generic "General SMB Capability Pack" name: renamed to "Core
  Business Capability Pack" to distinguish reusable capabilities from
  future industry-specific packs layered on top.
