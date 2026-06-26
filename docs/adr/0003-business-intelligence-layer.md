# ADR-0003: Business Intelligence Layer — deterministic derivation in MCP, raw SQL migrations, dual repository adapters

**Status:** accepted
**Date:** 2026-06-26

## Context

Goal 2 requires a non-AI Business Intelligence foundation (Business MRI,
Business DNA, Business Health Graph, Capability Graph, Timeline) that is
fully registry-driven, persisted, and exposed through typed services.
The goal explicitly excludes AI reasoning, recommendations, and Loop
Runtime involvement — this is strictly an "understand the business" layer.

Three architectural questions needed resolving: (1) where deterministic
DNA/Health/Capability derivation logic should live, (2) how the database
schema should be defined and validated, (3) how repositories should be
structured so services are testable without a live database.

## Decisions

1. **Deterministic derivation logic lives in `packages/mcp`.** Per the
   Two Laws, MCP owns all intelligence and Loop owns all execution. DNA,
   Health, and Capability derivation are intelligence, not execution, so
   they belong in MCP even though Goal 2 forbids AI/LLM reasoning. Each
   function (`deriveBusinessDna`, `deriveBusinessHealth`,
   `evaluateCapabilities`) is a fixed, documented function of MRI
   responses — no model calls — and is explicitly commented as a
   placeholder later goals may replace with real inference.
2. **Raw, sequentially numbered SQL migrations, not an ORM.** Three
   files in `packages/db/migrations` (`0001_business_intelligence.sql`
   schema, `0002_seed_mri_questions.sql` question catalog,
   `0003_seed_sample_business.sql` sample data) follow the
   `NNNN_description.sql` convention. `packages/db/src/migrate.ts` is a
   minimal runner that tracks applied migrations in a
   `schema_migrations` table; `packages/db/src/validateMigrations.ts`
   validates naming/sequence and applies all migrations to a disposable
   Postgres schema to catch SQL errors before they reach a real
   environment. Both were exercised against a local Postgres 16 instance
   during this goal, not just statically reviewed.
3. **Dual repository adapters (Postgres + in-memory) behind shared
   interfaces.** `packages/db/src/repositories/types.ts` defines one
   interface per entity family; `repositories/postgres/*` implement them
   against `pg`, `repositories/memory/*` implement them in-memory. This
   lets `apps/api` services and tests run the full create-MRI-DNA-Health-
   Capability-Timeline flow without a database connection, while the
   Postgres adapters are validated against `boss_dev`.

## Consequences

- `packages/mcp` now depends on `@boss/registries` (for health-dimension
  weights and pain-point penalties) — verified to not violate any
  dependency-cruiser rule, since registries are the Brain's declarative
  knowledge layer.
- `apps/api` contains only thin controllers that call services; all
  orchestration (persist + derive + emit timeline event) lives in
  `apps/api/src/services/*`, keeping controllers free of business logic
  as required.
- No HTTP transport (Express/Fastify/Next route handlers) is wired up
  yet — services and controllers are plain typed functions, tested via
  an in-memory container. Transport selection is deferred (see Tech Debt).
- `apps/web` Next.js pages (Business Setup, MRI, DNA, Health, Timeline)
  are not implemented in this goal; recommended as the next goal's scope.

## Alternatives Considered

- Putting derivation logic in `apps/api` directly: rejected — would
  blur the Brain/Engine boundary and make the logic unreachable from
  other future consumers of MCP.
- An ORM (Prisma/Drizzle): rejected for this goal to keep migrations
  explicit, reviewable SQL consistent with existing CLAUDE.md DB
  conventions; can be revisited if schema complexity grows.
