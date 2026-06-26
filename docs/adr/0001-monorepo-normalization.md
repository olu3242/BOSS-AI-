# ADR-0001: Monorepo normalization with pnpm + Turborepo

**Status:** accepted
**Date:** 2026-06-26

## Context

BOSS started as a documentation-only package (README, ARCHITECTURE,
CLAUDE.md, SKILL.md, landing pages, a reference `package.json`). To
start building product, the repo needed a real workspace structure
without redesigning the architecture those docs already describe.

## Decision

Adopt a pnpm workspace (`apps/*`, `packages/*`, `industry-packs/*`)
orchestrated by Turborepo, with a shared strict `tsconfig.base.json`
and flat ESLint config in `packages/config`, consumed by every
workspace member. Bounded contexts from `docs/architecture/ARCHITECTURE.md`
map directly onto packages: `packages/mcp` (Brain), `packages/loop`
(Engine), `packages/registries` (declarative knowledge), `packages/events`
(event contracts), `packages/types` (shared domain types).

## Consequences

- New capabilities live in a new `packages/*` or `apps/*` directory with
  a consistent `build`/`lint`/`typecheck`/`test` script contract, runnable
  individually or via `turbo run <task>` across the whole graph.
- Vertical knowledge (e.g. an industry pack) is added under
  `industry-packs/*` without touching platform packages.
- Placeholder `apps/web` / `apps/api` entrypoints exist but are not real
  Next.js/server apps yet — tracked as technical debt until the goal that
  needs them lands.

## Alternatives Considered

- Single flat package: rejected — violates the MCP/Loop separation from
  day one and would require a disruptive split later.
- Nx instead of Turborepo: rejected for now — Turborepo's simpler task
  graph is sufficient at this stage and matches the package.json shipped
  with the original BOSS package.
