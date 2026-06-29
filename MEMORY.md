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

## Goal 8 — Business Tool & Integration Fabric (complete)

**What:** Abstraction layer between AI Employees/Loop Runtime and external
providers (Gmail, Microsoft 365, Twilio, HubSpot, QuickBooks, Slack, etc.)
so nothing ever calls a provider SDK directly — every request goes through
a named Capability Contract and the Tool Fabric resolves the concrete
Tool + connected Provider.

### Registries (`packages/registries`)
- `capabilityContractRegistry` — 12 provider-agnostic capabilities
  (`send_email`, `send_sms`, `send_message`, `schedule_appointment`,
  `create_invoice`, `create_customer`, `update_crm`, `upload_document`,
  `generate_pdf`, `send_notification`, `store_file`, `search_contacts`),
  each with an `inputSchema`/`outputSchema`.
- `providerDefinitionRegistry` — 19 providers across email, sms,
  calendar, crm, accounting, storage, messaging categories.
- `toolDefinitionRegistry` — 12 tools, each the join of one capability +
  the providers that can fulfill it + required permissions +
  retry/timeout/rate-limit/audit policy.
- `industry-packs/general-smb/src/data/toolFabric.ts` seeds all three;
  pack version bumped to `0.5.0`.

### MCP (`packages/mcp`)
- `intelligence/toolFabric.ts` — `resolveCapability(capabilityKey,
  connectedIntegrations, roleKey, permissions)`: looks up the Tool for a
  capability, intersects its `supportedProviderKeys` with the business's
  currently-connected providers (never defaults to an unconnected one),
  checks permission for `(toolKey, roleKey)` (default
  `"approval_required"` if no policy row exists), throws
  `CapabilityNotFoundError` / `NoConnectedProviderError` /
  `PermissionDeniedError` as appropriate.
- `executeToolRequestSimulated(resolved, input)` — no real network call
  (Law 1: MCP never executes); returns a deterministic
  `{ status: "succeeded", output: { simulated: true, ... } }` so the rest
  of the fabric has something concrete to audit/track until a future Loop
  Runtime adapter performs the live call.

### Database (`packages/db`)
- `migrations/0008_tool_integration_fabric.sql` — 9 tables:
  `capability_contracts`, `provider_definitions`, `tool_definitions`
  (global/declarative), `integration_accounts`, `credential_references`
  (references only — `secret_ref` never stores a raw secret),
  `permission_policies`, `tool_executions`, `provider_health`,
  `tool_audit_history`.
- `migrations/0009_seed_tool_fabric.sql` — generated from the TypeScript
  source to avoid drift; executed and verified against a live local
  Postgres 16 instance (`boss_dev`): 12 capabilities, 19 providers, 12
  tools — exact match.
- `IntegrationAccountRepository`, `PermissionPolicyRepository`,
  `ToolExecutionRepository` (also owns `tool_audit_history`),
  `ProviderHealthRepository` — Postgres + in-memory adapters. Per the
  established convention, `ToolAuditRecord` and `ProviderHealth` extend
  `TenantScoped` only (not `Timestamped`) since their tables have no
  `deleted_at` column.

### API (`apps/api`)
- `services/toolFabricService.ts` — connect/disconnect integration,
  set/list permission policies, `requestTool()` (resolve → create
  pending `ToolExecution` → audit `tool.requested` → execute simulated →
  update status → audit `tool.<status>` → upsert `ProviderHealth`), list
  executions/audit history/provider health.
- `controllers/toolFabricController.ts` — thin, zero business logic.
- `__tests__/toolFabricFlow.test.ts` — connects an integration, sets a
  permission, requests a tool, asserts resolved provider/tool/status,
  audit records, and provider health; second test asserts a clean
  rejection when no provider is connected for the capability.

**Validation:** `pnpm -r typecheck`, `pnpm -r lint`, `pnpm -r build`,
`pnpm -r test` (apps/api: 5 tests/4 files, all other workspaces unchanged
and passing), `pnpm run arch:check` (no dependency violations, knip
clean) all pass. Migrations 0008/0009 executed and validated against
`boss_dev` with exact seeded row counts.

**Explicitly NOT done in this goal (by design):** AI Employees (Goal 9
depends on these capability contracts but is sequenced after), any real
provider HTTP client (Execution Adapter is simulated only), any
Integration Center / Connection Wizard UI, actual external secret-store
integration for `CredentialReference`.

**Known limitations / tech debt:** TD-013 (simulated Execution Adapter
only), TD-014 (no real secret-store integration), TD-015 (rate limits
declared but not enforced), TD-016 (no Integration Center UI).

**Recommended next goal:** Goal 9 — AI Workforce Layer, now unblocked
since AI Employees can request `SendMessage`/`ScheduleMeeting`/
`CreateCustomer`/`CreateInvoice`/etc. capabilities through this fabric
instead of touching providers directly.

## EP-1 pivot (master plan change)

Following Goal 8, the user submitted a sweeping "BOSS EP-1 CONVERGENCE
EXECUTION (BATCHES 3-12)" specification as the new governing plan,
explicitly superseding the old sequential Goal 7/8/9 numbering. Its
assumed baseline (org/signup/onboarding/dashboards/Mission Control
already built) did not match this repo's actual state — a convergence
audit confirmed only Goals 0-4 + Goal 8 exist; no org/signup/onboarding/
UI/Mission Control/Loop Runtime. The user was asked to choose between (a)
finish Loop Runtime first under the old numbering, (b) treat EP-1 as the
new master plan and restart planning from Batch 3 onward, or (c) stop for
review. **The user chose (b).** All subsequent work is now organized
under EP-1's batch numbering, not Goal N.

## Loop Runtime core (EP-1 Batch 5 prerequisite, complete)

Real execution engine for `packages/loop`, replacing the prior
interface-only skeleton (`WorkflowState`/`WorkflowInstance`/
`LoopRuntime.start()`). Required because Batches 5 (Autonomous Workflow
Generation), 6 (AI Employee Runtime — "use existing runtime, not a new
one"), 9 (Evidence/Timeline), and 10 (Business Operating Loop) all assume
a real runtime exists.

### Loop (`packages/loop`)
- `stateMachine.ts` — 11-state machine (`pending`, `queued`, `running`,
  `waiting`, `approved`, `rejected`, `completed`, `failed`, `cancelled`,
  `rolled_back`, `timed_out`) with an explicit `TRANSITIONS` adjacency map,
  `assertTransition()`/`InvalidStateTransitionError`.
- `taskHandlerRegistry.ts` — function-based registry (`Map<TaskType,
  TaskHandler>`), distinct from the data-only `@boss/registries` pattern
  since handlers are executable code, not declarative metadata.
- `ports.ts` — `WorkflowExecutionPort`, `TaskExecutionPort`,
  `ExecutionEventPort`, `DeadLetterPort` interfaces; `packages/loop` has
  zero dependency on `@boss/db` or `@boss/mcp` (enforced by
  `.dependency-cruiser.cjs`'s `loop-never-imports-mcp` /
  `loop-never-imports-industry-packs` rules) — `apps/api` supplies
  concrete repositories satisfying these shapes.
- `runtime.ts` — `createLoopRuntime(ports, handlers, eventBus)`. Sequential
  step execution, retry up to `step.maxRetries` (default 0), dead-letter
  on exhausted retries, reverse-order compensation rollback via
  `step.compensationTaskType` on any step failure, dual-channel event
  emission (durable `ExecutionEventPort.append()` + live `EventBus.publish()`)
  at every transition (`execution.created/started/completed/failed`,
  `task.created/started/retrying/completed/failed`, `rollback.started/completed`).

### Events (`packages/events`)
- `createInMemoryEventBus()` (new) — first real `EventBus` implementation
  (previously interface-only), synchronous `Map`-based pub/sub.
- Fixed a circular import (`index.ts` ↔ `inMemoryEventBus.ts`) by
  extracting `BossEvent`/`EventBus` into `eventBus.ts`.

### Types (`packages/types/src/ontology.ts`)
- New: `ExecutionState`, `TaskType`, `WorkflowExecution`, `TaskExecution`,
  `ExecutionEventRecord` (extends `TenantScoped` only — append-only, no
  `deleted_at`), `DeadLetterEntry`.

### Database (`packages/db`)
- `migrations/0010_loop_runtime.sql` — `workflow_executions`,
  `task_executions`, `execution_events`, `dead_letter_queue`. Applied and
  validated against live local Postgres (`boss_dev`); all 10 migrations
  pass `validateMigrations`.
- `WorkflowExecutionRepository`, `TaskExecutionRepository`,
  `ExecutionEventRepository`, `DeadLetterRepository` — Postgres +
  in-memory adapters, added to `types.ts` and `index.ts` exports.

### API (`apps/api`)
- `services/loopRuntimeService.ts` (new) — composes `createLoopRuntime()`
  with concrete handlers: `"tool"` delegates to
  `toolFabricService.requestTool()`; `"ai"`/`"manual"`/`"scheduled"` are
  explicit not-implemented stubs (no AI Employee runtime yet — Batch 6).
- `container.ts` extended with `workflowExecutions`, `taskExecutions`,
  `executionEvents`, `deadLetters` repositories.
- `__tests__/loopRuntimeFlow.test.ts` — 4 tests: full multi-step
  success + canonical event sequence, retry-then-succeed, failure with
  compensation rollback + dead-letter, and the `loopRuntimeService`
  tool-handler integration against `toolFabricService`.

**Validation:** `pnpm -r typecheck/lint/build/test` and `pnpm run
arch:check` all pass (132 modules, 375 dependencies cruised, knip clean
after removing the now-unnecessary `@boss/loop` knip ignore entry).
Migration 0010 applied and validated against live `boss_dev`.

**Explicitly NOT done in this slice (by design, logged as tech debt):**
no real scheduler (immediate execution only — no scheduled/recurring/
business-hours-aware modes), no timeout enforcement (the `timed_out`
state exists in the machine but nothing transitions into it), no
parallel/conditional step execution (sequential only), no separate
metrics/logs tables beyond `ExecutionEventRecord` + the current `state`
field.

**Recommended next step:** EP-1 Batch 5 — Autonomous Workflow Generation
(approved recommendation → registries → execution graph → this runtime →
evidence → Mission Control), now unblocked by a real execution engine.

## Goal 9: Domain Event Backbone (complete)

User directive (via `/goal`, superseding prior EP-1 batch numbering):
finish Goal 9 — wire canonical domain events into MRI, Health,
Constraints, Recommendations, and Tool Fabric so the EventBus introduced
for the Loop Runtime (ADR-0007) becomes the backbone of the platform.
Goals 10-15 queued after it (autonomous workflow generator, AI Employee
runtime, Mission Control, customer-facing API/web app/hardening).

### Decisions
- `eventBus: EventBus` added as a field on `RepositoryContainer`
  (`apps/api/src/container.ts`) rather than a new parameter threaded
  through every `createXService()` call — zero call sites needed to
  change shape since every service already takes `repos` only. Both
  `createPostgresContainer()` and `createInMemoryContainer()` construct
  one `createInMemoryEventBus()` and attach it.
- `loopRuntimeService.ts` now consumes `repos.eventBus` instead of
  constructing its own — this is what makes the bus an actual shared
  backbone instead of N independent instances.
- Canonical event naming: `{context}.{entity}.{verb}` per CLAUDE.md's API
  Conventions (matches the dot-separated style already used by
  `packages/loop/src/runtime.ts`): `business.mri.started`,
  `business.mri.completed`, `business.health.calculated`,
  `business.constraints.analyzed`, `business.constraint.dismissed`,
  `business.recommendations.generated`, `business.recommendation.approved`,
  `tool.execution.requested`, `tool.execution.succeeded`/`.failed`.
- Domain events are live pub/sub only, published alongside (not instead
  of) each service's existing `businessTimeline.append()` /
  `toolExecutions.addAuditRecord()` durable write. No new persistence
  table or migration — logged as TD-021 (no durable domain-event log/
  replay) rather than silently built speculatively.

### Files
- `apps/api/src/container.ts`, `apps/api/src/services/loopRuntimeService.ts`,
  `businessMriService.ts`, `businessHealthService.ts`,
  `businessConstraintService.ts`, `businessRecommendationService.ts`,
  `toolFabricService.ts` — all edited.
- `apps/api/src/__tests__/domainEventsFlow.test.ts` (new) — subscribes to
  all 10 canonical event types, runs a full business → MRI → Health →
  Constraints → Recommendations → Tool Fabric flow, asserts each fires.
- `docs/adr/0008-domain-event-backbone.md` (new).
- `docs/execution/TECH_DEBT.md`: TD-021 added.
- `CHANGELOG.md`: Goal 9 entry added above the Loop Runtime entry.

**Validation:** `pnpm -r typecheck/lint/build/test` and `pnpm run
arch:check` all pass (133 modules, 383 dependencies cruised, knip clean).

**Recommended next step:** Goal 10 — autonomous workflow generator that
transforms approved recommendations into executable graphs for the Loop
Runtime, now that both the execution engine and the event backbone exist.

## Goal 10: Autonomous Workflow Generator (complete)

User directive (via `/goal`): build the autonomous workflow generator that
transforms recommendations into executable graphs for the Loop Runtime.
Goals 11-15 queued after it (AI Employee runtime, Mission Control,
customer-facing API/web app/hardening).

### Decisions
- `generateWorkflowGraph()` lives in `packages/mcp/src/intelligence/
  workflowGenerator.ts`. It cannot import `StepSpec` from `@boss/loop`
  (`mcp-never-imports-loop`), so it defines a structurally identical local
  `GeneratedWorkflowStep`/`GeneratedWorkflowGraph` shape; TypeScript's
  structural typing lets `apps/api` pass the generated steps straight into
  `loopRuntime.execute(..., steps: StepSpec[])` with no adapter.
- One `"tool"` step per entry in `BusinessRecommendation.relatedCapabilities`
  — no new workflow-template registry. `WorkflowDefinitionEntry` was
  confirmed metadata-only (no `steps` field) and nothing else maps
  `definitionKey` to an executable graph, so deriving steps directly from
  the field that already exists was the non-speculative choice.
- New `workflowGenerationService` (`apps/api`) is the orchestration seam:
  looks up the recommendation, generates the graph, appends a
  `workflow_generated` timeline entry, publishes `workflow.generated`,
  executes via `loopRuntime.execute()`, then publishes
  `workflow.completed`/`workflow.failed`.
- Auto-trigger wired through the existing event backbone: `apps/api/src/
  index.ts` subscribes to `business.recommendation.approved` (from Goal 9)
  and calls `workflowGeneration.generateAndExecute()` — approval and
  execution stay fully decoupled.
- `TimelineEventType` gained `"workflow_generated"` (closed union, required
  extension).
- Hardened `loopRuntimeService.ts`'s `"tool"` handler with a try/catch
  around `toolFabric.requestTool()`. `runtime.ts`'s `runStep()` has no
  surrounding try/catch around the handler call — handlers are
  contractually required to always resolve to `{ output, errorMessage }`,
  never throw. This was a latent gap exposed by generated (not hand-written)
  steps whose `capabilityKey` may not resolve to a registered tool.

### Files
- `packages/mcp/src/intelligence/workflowGenerator.ts` (new),
  `packages/mcp/src/index.ts` (export added).
- `apps/api/src/services/workflowGenerationService.ts` (new).
- `apps/api/src/services/loopRuntimeService.ts` — try/catch hardening.
- `apps/api/src/index.ts` — auto-trigger subscription, service exposed.
- `packages/types/src/ontology.ts` — `"workflow_generated"` added to
  `TimelineEventType`.
- `apps/api/src/__tests__/workflowGenerationFlow.test.ts` (new) — approve →
  generate → execute flow, plus the event-driven auto-trigger path.
- `docs/adr/0009-autonomous-workflow-generator.md` (new).
- `docs/execution/TECH_DEBT.md`: TD-022 added.
- `CHANGELOG.md`: Goal 10 entry added.

**Validation:** `pnpm -r typecheck/lint/build/test` and `pnpm run
arch:check` all pass (136 modules, 399 dependencies cruised, knip clean).

**Recommended next step:** Goal 11 — AI Employee runtime on top of the
Loop Runtime and Tool Fabric.
