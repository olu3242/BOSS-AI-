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

## Goal 3 — Constraint Intelligence Engine (complete)

Full ADR: `docs/adr/0004-constraint-intelligence-engine.md`.

### Registries (`packages/registries`)
- `constraintCategory.ts` — `constraintCategoryRegistry` (13 declarative
  category entries: sales, marketing, operations, scheduling, finance,
  customer_experience, communication, reporting, staff_productivity,
  compliance, technology, leadership, growth).
- `constraintDefinition.ts` — `constraintDefinitionRegistry` and the
  declarative `ConstraintDetectionRule` union (`mri_response_equals`,
  `mri_response_in`, `mri_response_includes`, `health_dimension_below`,
  `capability_maturity_in`) plus `ConstraintImpactModel`. Adding a new
  constraint requires only a new registry entry, no engine changes.

### Capability pack (`industry-packs/general-smb`)
- `data/constraintCategories.ts` / `data/constraintLibrary.ts` — seed the
  13 categories and 20 General SMB Constraint Library definitions, each
  with detection rules, a fixed impact model, and related capabilities.
  Pack version bumped to `0.3.0`.
- `installGeneralSmbPack()` made idempotent (module-level guard) since
  `apps/api` now installs it at container-construction time and
  `createRegistry().register()` throws on duplicate keys.

### Intelligence (`packages/mcp`)
- `intelligence/constraintEngine.ts` — `detectConstraints()` evaluates
  every registry-driven detection rule against MRI responses, health
  dimensions, and capability assessments (any rule match is sufficient
  evidence); `prioritizeConstraints()` computes six deterministic
  sub-scores, a fixed-weight `overallScore`, and buckets into five
  priority levels via fixed thresholds. No hallucinated values anywhere
  in the impact-estimation path — all numeric impact is a scaled
  function of `employeeCount`.

### Database (`packages/db`)
- `migrations/0004_constraint_intelligence.sql` — 8 tables
  (`constraint_categories`, `constraint_definitions`,
  `constraint_instances`, `constraint_evidence`,
  `constraint_relationships`, `constraint_scores`,
  `constraint_priorities`, `constraint_history`).
- `migrations/0005_seed_constraint_library.sql` — seeds the 13 categories
  and 20 definitions, mirroring the TypeScript registries exactly.
- Both **executed and verified against a live local Postgres 16
  instance** (`boss_dev`): `constraint_categories`=13,
  `constraint_definitions`=20, all 8 tables present.
- `businessConstraintRepository`, `constraintScoreRepository`,
  `constraintPriorityRepository` — Postgres + in-memory adapters
  following the Goal 2 pattern. The in-memory
  `ConstraintPriorityRepository` is constructed with a reference to the
  in-memory `BusinessConstraintRepository` (rather than zero-arg) since
  `ConstraintPriority` doesn't denormalize `businessId`.

### API (`apps/api`)
- `services/businessConstraintService.ts` — `analyze()` runs detection +
  prioritization, persists constraints + evidence + scores + priorities,
  re-fetches each constraint with evidence, and appends a
  `constraint_analysis_completed` timeline event; `list`, `getPriorities`,
  `dismiss` (with history recording) round out the service.
- `controllers/businessConstraintController.ts` — thin, zero business
  logic, matching the Goal 2 controller pattern exactly.
- `container.ts` now depends on `@boss/industry-pack-general-smb` and
  calls `installGeneralSmbPack()` before constructing either repository
  container, closing the registry-seeding gap the new engine introduced.
- `__tests__/constraintAnalysisFlow.test.ts` — full end-to-end test:
  create business → complete MRI → derive DNA/Health/Capabilities →
  analyze constraints → asserts constraints/scores/priorities/evidence,
  `list`/`getPriorities`/`dismiss`, and the `constraint_analysis_completed`
  timeline event. Passing.

**Validation:** `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`,
`pnpm -r test` (api: 2 integration tests/2 files, all other workspaces
unchanged and passing) and `pnpm run arch:check` (`✔ no dependency
violations found (96 modules, 244 dependencies cruised)`, knip clean) all
pass. Migrations executed and validated against `boss_dev`.

**Explicitly NOT done in this goal (by design):** AI agents, workflows,
Loop Runtime, recommendations — detection/classification/prioritization/
explanation only, per the goal's explicit scope. `apps/web` UI for
constraints is deferred.

**Known limitations / tech debt (see `docs/execution/TECH_DEBT.md`):**
TD-009 (Constraint Graph relationship/history tables are persisted but
not yet exposed through any API read path), TD-010 (pack installation is
hardcoded to `general-smb` in `apps/api`'s container — no
runtime-configurable pack selection yet).

**Recommended next goal:** Goal 4 — Recommendation Intelligence Engine:
transform detected constraints into measurable, ranked, explainable
recommendations with ROI forecasts and a transformation roadmap —
diagnose/rank/explain/forecast only, no execution (deferred to a future
Loop Runtime).

## Goal 4 — Recommendation Intelligence Engine (complete)

Full ADR: `docs/adr/0005-recommendation-intelligence-engine.md`.

### Registries (`packages/registries`)
- `recommendationCategory.ts` — `recommendationCategoryRegistry` (13
  declarative category entries: sales, marketing, operations, customer
  experience, finance, scheduling, communication, reporting, technology,
  leadership, growth, compliance, productivity).
- `recommendationDefinition.ts` — `recommendationDefinitionRegistry` and
  the declarative `triggerConstraintKeys: string[]` matching contract,
  fixed `RecommendationRoiModel`, and the Approval Model
  (`auto`/`approval_required`/`executive_review`/`manual_only`). Reuses
  `ImpactLevel` from `constraintDefinition.ts` (single source of truth).

### Capability pack (`industry-packs/general-smb`)
- `data/recommendationCategories.ts` / `data/recommendationLibrary.ts` —
  seed the 13 categories and 15 General SMB Recommendation Library
  definitions, each with `triggerConstraintKeys`, a fixed ROI model, and
  a declared Transformation Roadmap stage. Pack version bumped to
  `0.4.0`.

### Intelligence (`packages/mcp`)
- `intelligence/recommendationEngine.ts` — `generateRecommendations()`
  matches active `BusinessConstraint[]` against each definition's
  `triggerConstraintKeys`, scaling ROI/effort/cost by the same
  `sizeFactor` pattern Goal 3 established; `prioritizeRecommendations()`
  computes `priorityScore`, `businessValueScore`, `implementationScore`,
  `strategicScore`, `overallScore` as fixed weighted sums, bucketed into
  five priority levels via the same fixed thresholds as Goal 3;
  `buildTransformationRoadmapStages()` groups recommendations into the
  five fixed `RecommendationStage`s. No hallucinated values anywhere in
  the ROI path.

### Database (`packages/db`)
- `migrations/0006_recommendation_intelligence.sql` — 11 tables
  (`recommendation_categories`, `recommendation_definitions`,
  `recommendation_instances`, `recommendation_constraint_links`,
  `recommendation_evidence`, `recommendation_roi_estimates`,
  `recommendation_scores`, `recommendation_priorities`,
  `transformation_roadmaps`, `transformation_roadmap_stages`,
  `recommendation_history`).
- `migrations/0007_seed_recommendation_library.sql` — seeds the 13
  categories and 15 definitions, mirroring the TypeScript registries
  exactly (generated programmatically from the source files to avoid
  transcription drift).
- Both **executed and verified against a live local Postgres 16
  instance** (`boss_dev`): `recommendation_categories`=13,
  `recommendation_definitions`=15, all 11 tables present.
- `businessRecommendationRepository`, `recommendationScoreRepository`,
  `recommendationPriorityRepository`, `transformationRoadmapRepository`
  — Postgres + in-memory adapters following the Goal 2/3 pattern. The
  in-memory `RecommendationPriorityRepository` is constructed with a
  reference to the in-memory `BusinessRecommendationRepository` for the
  same reason Goal 3's `ConstraintPriorityRepository` was.

### API (`apps/api`)
- `services/businessRecommendationService.ts` — `analyze()` reads only
  *active* constraints, runs derivation + prioritization, persists
  recommendations + evidence + scores + priorities, builds and upserts
  the `TransformationRoadmap`, and appends a `recommendations_generated`
  timeline event; `list`, `getPriorities`, `getRoadmap`, `dismiss`,
  `approve` (both with history recording) round out the service.
- `controllers/businessRecommendationController.ts` — thin, zero
  business logic, matching the Goal 2/3 controller pattern exactly.
- `__tests__/recommendationFlow.test.ts` — full end-to-end test: create
  business → complete MRI → derive DNA/Health/Capabilities → analyze
  constraints → analyze recommendations → asserts
  recommendations/scores/priorities/evidence/roadmap (5 stages, all
  recommendations accounted for), `list`/`getPriorities`/`getRoadmap`,
  `approve`, and the `recommendations_generated` timeline event. Passing.

**Validation:** `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`,
`pnpm -r test` (api: 3 integration tests/3 files, all other workspaces
unchanged and passing) and `pnpm run arch:check` (no dependency
violations, knip clean) all pass. Migrations executed and validated
against `boss_dev`.

**Explicitly NOT done in this goal (by design):** AI agents, workflow
execution, Loop Runtime, Tool Fabric/provider calls — diagnosis,
ranking, explanation, and forecasting only, per the goal's explicit
scope. `apps/web` UI for the Recommendation Center/Transformation
Roadmap is deferred. The Approval Model and Execution Blueprint concept
are persisted as data only; nothing consumes or acts on them yet.

**Known limitations / tech debt (see `docs/execution/TECH_DEBT.md`):**
TD-011 (Transformation Roadmap/Approval Model persisted but not
consumed by any runtime yet), TD-012 (`recommendation_instances.
dependencies` is a flat `jsonb` array, not a dedicated relationship
table like Goal 3's `constraint_relationships`).

**Recommended next goal:** Goal 5 — `apps/web` Next.js UI for the
Recommendation Center and Transformation Roadmap, plus HTTP transport
for `apps/api`, so the Constraint/Recommendation intelligence built in
Goals 3–4 has a real user-facing surface — though see the Goal 8/9
redirect below for an architectural reordering proposed before AI
Workforce work begins.
