# Project Health Dashboard

Updated during OC1 Wave A closure on 2026-06-28. This is a
repository snapshot, not a live operations dashboard.

## Current status

| Area | Status | Notes |
|------|--------|-------|
| CI-equivalent validation | Green locally | `pnpm.cmd typecheck`, `pnpm.cmd lint`, `pnpm.cmd test`, `pnpm.cmd build`, and `pnpm.cmd arch:check` pass. |
| Architecture validation | Green locally | Dependency boundaries and dead-code checks pass through `pnpm.cmd arch:check`. |
| Web application | Internal alpha foundation | `@boss/web` is now a Next.js App Router app with command-center page, loading state, error boundary, global styles, and production build. |
| API application | Internal alpha foundation | `@boss/api` exposes a local development HTTP health server at `/health` and retains the service/controller APIs. |
| Business intelligence workflow | Certified in memory | Setup, MRI response, DNA, health, constraints, recommendations, and command-center rendering are covered by API and Web tests. |
| Canonical Business Context | Engineering GO, environmentally blocked | Tenant-scoped context, immutable versions, lifecycle, events, audit, and fail-closed workflow/agent guards pass; live migration/RLS requires PostgreSQL. |
| Business Knowledge Graph | Engineering GO, environmentally blocked | Versioned graph persistence, deterministic runtime traversal, structural validation, tenant-aware cache invalidation, registries, events, and execution guards pass; migration `0013` lacks live PostgreSQL evidence. |
| Business Semantic Layer | Engineering GO | Versioned semantic contracts, context/dependency resolution, eight registered views, cache invalidation, audit, events, and architecture enforcement pass locally. |
| Business Query & Insight Layer | Engineering GO | Fourteen canonical queries, reusable projections, factual insights, pagination, streaming, performance metrics, cache invalidation, audit, and consumer guards pass locally. |
| Business Knowledge Platform | GO with environmental blockers | Capability 2 Batches 1-4 pass engineering gates; live migration `0013` application and RLS probing require PostgreSQL. |
| Capability Pack Platform | Engineering GO | Signed manifests, compatibility/dependency validation, tenant lifecycle, activation, compensated upgrades, rollback, removal, registries, events, audit, and all repository gates pass. |
| Registry architecture | Conditional go | Agent, capability, execution, graph, and governance metadata are certified; automation and orchestrator registries remain empty. |
| Database | Provider-ready, externally blocked | Identity tables, audit storage, constraints, RLS, and tenant repositories are locally validated; live PostgreSQL migration and RLS evidence require a target. |
| Auth | GO with environmental blockers | Browser signup, verification, reset, sessions, refresh, logout, organization switching, route protection, and durable audit wiring pass local gates; deployed Supabase/email/HTTPS evidence is outstanding. |
| RBAC | Integrated in identity runtime | Tenant membership and role/action checks run through centralized authorization; full HTTP route coverage remains open. |
| Automation runtime | Internal-alpha runtime | Queue, worker handlers, bounded retry, scheduler, dead-letter, replay, and health diagnostics are tested in memory. |
| AI runtime | Internal-alpha runtime | Registered agents execute with injected models, prompts, context, tools, scoped memory, events, and metrics. |
| Observability | Internal-alpha runtime | Structured logs, metrics, event delivery, execution history, trace context, and health are tested; production exporters and dashboards remain open. |

## Completed milestones

- Repository normalization and core package boundaries.
- Claude branch harvest and harmonization.
- Business intelligence service and repository flows.
- Command-center renderer and Next.js startup repair.
- Local API health server for development startup.
- Production certification utilities for RBAC, audit, observability, and health checks.
- PI-1 registry, dependency graph, governance, and ownership certification.

## Next milestone

Phase B / Universal Capability Runtime, after Capability Pack Platform
certification. SDK, governance, marketplace operations, and Business Capability
Lifecycle enforcement remain separate capabilities.

See [CURRENT_TO_FUTURE_GAP_ANALYSIS.md](./CURRENT_TO_FUTURE_GAP_ANALYSIS.md)
for the evidence-based domain scores, sequencing rationale, and exit criteria.
