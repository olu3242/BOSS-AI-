# BOSS Implementation Memory

## Goal 0 — Repository Normalization (complete)

**Status:** Done. Monorepo scaffolded, tooling configured, all pipelines green.

**What exists:**
- Canonical docs sourced from the uploaded package: `README.md`, `CLAUDE.md` (root),
  `docs/architecture/ARCHITECTURE.md` + diagram, `docs/execution/SKILL.md`.
- pnpm workspace (`apps/*`, `packages/*`, `industry-packs/*`) + Turborepo pipeline
  (`build`, `dev`, `lint`, `typecheck`, `test`, `clean`).
- Shared TS config (`packages/config/tsconfig.base.json`, strict mode, ES2022) and
  flat ESLint config (`packages/config/eslint.base.js`) consumed by every workspace
  member via root `tsconfig.json` / `eslint.config.js`.
- Prettier config at root.
- Workspace skeletons (package.json + tsconfig.json + minimal `src/index.ts`).
- Landing pages moved to `apps/web/public/`.

## Goal 0.5 — Engineering Operating System + Core Business Foundation (complete)

**Status:** Done. Governance, CI/CD, architecture validation, canonical ontology,
and the registry-driven Core Business Capability Pack are all in place and green.

### Engineering Operating System
- `MEMORY.md` (this file) — living architecture/status record.
- `CHANGELOG.md` — Keep a Changelog format, `[Unreleased]` + `[0.1.0]`.
- `CONTRIBUTING.md` — setup, branch naming, ADR-first policy for architectural
  changes, validation commands, PR template usage.
- `CODEOWNERS` — default owner plus per-bounded-context ownership
  (`packages/mcp`, `packages/loop`, `packages/registries`, etc.).
- `docs/execution/DEFINITION_OF_DONE.md` — the checklist every feature must clear
  before merge (bounded context, domain events, schema, API contract, policy,
  telemetry, audit log, UI states, acceptance criteria, feature flag, validation,
  arch:check, MEMORY.md/CHANGELOG.md updates, ADR where applicable).
- `docs/execution/CODING_STANDARDS.md` — TS strictness rules, registry authoring
  rules (explicit `seedX()`/`installX()` functions, not import-time side effects),
  package structure, Two Laws enforcement details, testing rules.
- `docs/execution/TECH_DEBT.md` — TD-001 through TD-006, open/unassigned, with a
  process section for adding new entries.
- `docs/execution/PROJECT_HEALTH.md` — status table (CI 🟢, arch validation 🟢,
  dependency audit 🟢, test coverage 🟡, DB/auth/apps 🔴, registries 🟢, ontology 🟢).
- `docs/adr/` — ADR process (`README.md`, `TEMPLATE.md`), ADR-0001 (monorepo
  normalization), ADR-0002 (registry-driven capability packs, General SMB →
  Core Business Capability Pack rename rationale).

### GitHub Governance
- `.github/PULL_REQUEST_TEMPLATE.md` — Summary / bounded context / DoD checklist
  / test plan.
- `.github/ISSUE_TEMPLATE/feature_request.md`, `bug_report.md`,
  `architecture_proposal.md`.

### CI/CD Foundation
- `.github/workflows/ci.yml` — runs on PR + push to main: install (frozen
  lockfile), lint, typecheck, build, test, `arch:check`, `pnpm audit`
  (advisory, `continue-on-error: true` — documented trade-off in the workflow
  file itself).

### Architecture Validation
- `.dependency-cruiser.cjs` — encodes the Two Laws as enforceable rules:
  `no-circular`, `mcp-never-imports-loop`, `loop-never-imports-mcp`,
  `loop-never-imports-industry-packs`,
  `industry-packs-only-depend-on-registries-and-types`.
- `knip.json` — dead-code detection across all workspaces. Forward-declared
  stack dependencies (`@anthropic-ai/sdk`, `@supabase/supabase-js`, `zod`) and
  not-yet-implemented internal workspace deps (`@boss/types`, `@boss/shared`,
  `@boss/mcp`, `@boss/loop`, `@boss/ui`) are explicitly allow-listed via
  `ignoreDependencies` — they are intentional contracts for stub packages, not
  dead code.
- Root scripts: `pnpm arch:check` = `arch:boundaries && arch:deadcode`.
- Result: `✔ no dependency violations found (34 modules, 56 dependencies
  cruised)`; knip reports zero unused files/exports/dependencies.

### Canonical Business Ontology
- `packages/types/src/primitives.ts` — `ID` primitive (extracted to break a
  circular import between `index.ts` and `ontology.ts`).
- `packages/types/src/ontology.ts` — ~30 canonical entities: `Organization`
  (root), `Business`, `TenantScoped`, `Timestamped`, `Location`, `Department`,
  `Employee`, `Customer`, `Lead` (+ `LeadStatus`), `Vendor`, `Product`,
  `Service`, `Appointment` (+ `AppointmentStatus`), `Invoice` (+
  `InvoiceStatus`), `Task` (+ `TaskStatus`), `Capability`, `Constraint`, `KPI`,
  `Recommendation`, `Goal`, `Report`, `BusinessMRI`, `BusinessDNA`,
  `BusinessHealth`, `BusinessTimelineEntry`, `BossEventRecord`,
  `Notification`, `Integration`, `Policy`, `MemoryRecord`.
- `docs/architecture/BUSINESS_ONTOLOGY.md` — canonical entity catalog.
- `docs/architecture/BUSINESS_GRAPH.md` — canonical relationship graph
  (Organization owns Business → … → Business Health generates Continuous
  Optimization), tied to ARCHITECTURE.md §2 bounded contexts.
- Rule: every future module extends this ontology/graph — no module may
  invent a competing concept.

### Registries Created (`packages/registries`)
All built on a single generic, immutable-after-registration factory
(`createRegistry<TEntry>()`, duplicate-key registration throws):
- `capabilityRegistry` — `CapabilityEntry` (key, label, description).
- `constraintRegistry` — `ConstraintEntry` (+ `relatedCapabilities`).
- `kpiRegistry` — `KpiEntry` (description, formula, owner, frequency, target
  range).
- `aiEmployeeRegistry` — `AiEmployeeEntry` (mission, responsibilities,
  capabilities, requiredTools, kpis, permissions, escalationRules, lifecycle).
- `workflowRegistry` — `WorkflowEntry`.
- `promptRegistry` — `PromptEntry` (role: system/agent/analysis/industry).
- `policyRegistry` — `PolicyEntry`, seeded with 5 canonical policies
  (approval.workflow_execution, security.tenant_isolation,
  privacy.pii_handling, execution.token_budget,
  escalation.owner_notification).
- `eventRegistry` — `EventEntry`, seeded with 20 canonical domain events
  (`organization.created` … `dashboard.updated`).
- `seedCoreRegistries()` (`packages/registries/src/seed/`) wires the
  platform-level seed functions (events, policies); capability packs call
  their own `seedX()`/`installX()` functions to populate the rest.

### Core Business Capability Pack (`industry-packs/general-smb`)
Renamed in intent from "General SMB Capability Pack" — reusable across any
small business, not vertical-specific. `installGeneralSmbPack()` calls all
seed functions and registers:
- 15 capabilities, 10 constraints (cross-referencing capabilities), 11 KPIs,
  7 AI employees (fully defined per the `AIEmployee` contract), 6 workflow
  definitions, 7 system prompts (one per AI employee).
- Cross-reference integrity is enforced by real tests (not just code review):
  constraint→capability, AI employee→KPI, workflow→constraint,
  prompt-per-employee — `industry-packs/general-smb/src/__tests__/
  installGeneralSmbPack.test.ts` (6 tests).
- `packages/registries/src/__tests__/createRegistry.test.ts` covers the
  factory itself (register/list/get, duplicate-key rejection).

**Validation:** `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm build`,
`pnpm test`, `pnpm arch:check` all pass — 16/16 workspace tasks green, 8 tests
passing, zero architecture violations, zero dead code.

**Explicitly NOT done in this goal (by design):** Business MRI logic, workflow
execution, dashboards, AI execution. Registries hold declarative data only.

**Known limitations / tech debt (see `docs/execution/TECH_DEBT.md`):**
- `apps/web` and `apps/api` are still placeholder TS entrypoints.
- No database, no Supabase wiring, no auth.
- `pnpm audit` step in CI is advisory only (`continue-on-error: true`).
- Test coverage is integrity-focused (cross-reference checks), not exhaustive
  per-field validation.

**Recommended next goal:** Goal 1 — Business Intelligence Foundation: Business
Profile, Business Capability Assessment, Business MRI Framework (registry-
driven, no AI reasoning), Business Health Framework, Business Timeline (data
model only), Business DNA (descriptive only), Repository Layer, database
schema, API contracts, minimal UI — explicitly excluding AI reasoning,
recommendations, Loop Runtime execution, and dashboards.

## Goal 2 — Business Intelligence Layer (complete)

**Status:** Done. Business MRI, Business DNA, Business Health Graph,
Capability Graph, and Business Timeline are persisted, derived, and exposed
through typed services — strictly non-AI, per the Two Laws. See
`docs/adr/0003-business-intelligence-layer.md`.

### Database (`packages/db`)
- Raw, sequentially-numbered SQL migrations in `packages/db/migrations`:
  `0001_business_intelligence.sql` (11 tables: `businesses`,
  `business_profiles`, `business_mri`, `business_mri_sections`,
  `business_mri_responses`, `business_dna`, `business_health`,
  `business_health_dimensions`, `business_capabilities`,
  `business_timeline`, `schema_migrations`), `0002_seed_mri_questions.sql`
  (question catalog), `0003_seed_sample_business.sql` (sample business +
  realistic responses).
- All three migrations **executed and verified against a live local
  Postgres 16 instance** (`boss_dev`), not just statically reviewed: row
  counts confirmed (`business_mri_responses`=35,
  `business_health_dimensions`=10, `business_capabilities`=9,
  `business_timeline`=6).
- `src/client.ts` — pooled `pg` connection (`DATABASE_URL` env var, local
  fallback), `query()`, `withTransaction()`, `firstRow()` helper for
  `noUncheckedIndexedAccess`-safe `RETURNING *` call sites.
- `src/migrate.ts` — idempotent migration runner tracked in
  `schema_migrations`.
- `src/validateMigrations.ts` — validates `NNNN_description.sql`
  naming/sequence statically, then applies all migrations to a disposable
  Postgres schema to catch SQL errors before they reach a real environment
  (exercised against `boss_dev`, not just reviewed).
- `src/repositories/types.ts` — one interface per entity family (Business,
  BusinessProfile, BusinessMri incl. sections/responses, BusinessDna,
  BusinessHealth incl. dimensions, BusinessCapability, BusinessTimeline).
- `src/repositories/postgres/*` — parameterized-SQL implementations against
  `pg`, enforcing `org_id` scoping and `deleted_at IS NULL` (soft deletes)
  in application-level WHERE clauses.
- `src/repositories/memory/inMemoryRepositories.ts` — `Map`-based
  implementations of every interface, enabling full-flow tests without a
  database connection.

### Intelligence (`packages/mcp`)
- Deterministic, rule-based (explicitly non-AI) derivation functions:
  `deriveBusinessDna`, `deriveBusinessHealth`, `evaluateCapabilities` — each
  a fixed, documented function of MRI responses, commented as a future
  placeholder for real inference. Depends on `@boss/registries` for
  health-dimension weights and pain-point penalties (verified: no
  dependency-cruiser violation).

### API (`apps/api`)
- `container.ts` — `RepositoryContainer` wiring either Postgres or
  in-memory repositories behind the same interfaces.
- `services/*` — one service per entity family
  (businessProfile/Mri/Dna/Health/Capability/Timeline); all orchestration
  (persist + derive + emit timeline event) lives here.
- `controllers/*` — thin factory functions with **zero business logic**,
  delegating entirely to services.
- `index.ts` — `createApi()` wires the full Postgres-backed container; no
  HTTP transport (Express/Fastify/Next route handlers) is wired up yet
  (see Tech Debt TD-002).
- `__tests__/businessIntelligenceFlow.test.ts` — full end-to-end test:
  create business → start/answer/complete MRI → derive DNA → derive Health
  → evaluate Capabilities → asserts exact ordered timeline of 6 event
  types. Passing.

**Validation:** `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`,
`pnpm -r test` (db: 3 tests/2 files, mcp: 7 tests/3 files, general-smb: 6
tests, api: 1 integration test) and `pnpm run arch:check` (`✔ no dependency
violations found (85 modules, 199 dependencies cruised)`, knip clean) all
pass.

**Explicitly NOT done in this goal (by design):** AI reasoning,
recommendations, Loop Runtime workflows, `apps/web` UI pages, HTTP
transport, Postgres row-level security.

**Known limitations / tech debt (see `docs/execution/TECH_DEBT.md`):**
TD-001 (`apps/web` has no real pages yet), TD-002 (`apps/api` has no HTTP
transport), TD-003 (rest of the ARCHITECTURE.md §6 schema beyond Business
Intelligence is unimplemented), TD-007 (derivation logic is rule-based, not
AI — future goal decides if/how to layer LLM reasoning on top), TD-008
(`org_id` scoping is application-level, not RLS).

**Recommended next goal:** Goal 3 — `apps/web` Next.js UI: Business Setup,
MRI, DNA, Health, and Timeline pages backed by the Goal 2 services, plus
HTTP transport for `apps/api` (Express/Fastify/Next route handlers) so the
UI has a real network boundary to call.
