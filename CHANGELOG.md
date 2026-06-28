# Changelog

## Unreleased

### PI-0 - Execution Constitution and Canonical Business Model

- Adopted the Execution Constitution as the highest-level product authority.
- Adopted the Canonical Business Model as the common business semantic model.
- Adopted the Business Maturity Model as the evidence-based customer roadmap.
- Adopted the Business Operating Loop as the canonical continuous cycle.
- Added an Architecture Review Board process and embedded its questions in the
  pull request template.
- Adopted company Operating Principles and the Customer Lifecycle Framework.
- Adopted the Product Operating Model with customer-value intake gates,
  scorecard thresholds, the Day-One Test, and the Small Business Filter.
- Retained TTFBV as the activation metric and defined minutes saved plus
  verified business outcomes as the north-star outcome family.
- Froze foundational strategy; future work moves to executable specifications
  and certified implementation.
- Defined Business Graph as canonical relationship/temporal state and Business
  Memory as an evidence-backed semantic view rather than a parallel store.
- Integrated constitutional checks into AI instructions, Engineering Operating
  System, Definition of Done, architecture governance, and the program plan.
- Renamed and decomposed the Executive Intelligence initiative as gated PI-2;
  no PI-2 implementation was introduced.

### Phase B - Universal Capability Runtime Batch 2

- Added the mandatory twelve-stage generic capability execution pipeline.
- Added five-hook stage lifecycle, deterministic coordination, immutable stage
  results, cleanup, and exact failure-stage propagation.
- Added recursive capability and pack dependency validation with cycle,
  version-range, runtime API, runtime registry, and feature registry checks.
- Added injectable generic executor, evidence writer, and result writer
  contracts with process-local defaults.
- Added completed, failed, and cancelled session finalization, five pipeline
  events, and pipeline/stage/event-count telemetry.
- Added seven pipeline tests without implementing retry, replay, scheduling,
  parallelism, or business behavior.

### Phase B - Universal Capability Runtime Batch 1

- Added immutable UCR execution, context, session, result, metadata, transition,
  and event contracts.
- Added a deterministic execution state machine and six stable typed errors.
- Added registry-backed capability, manifest, and dependency adapters,
  permission-aware context resolution, and immutable in-memory evidence.
- Added a non-executing lifecycle shell with four canonical events and existing
  runtime telemetry integration.
- Registered UCR and its state machine as internal alpha while keeping the
  Batch 2 execution pipeline explicitly planned.
- Added context, transition, event, telemetry, adapter, error, evidence, and
  registry tests without implementing business execution.

### Phase B - Capability Pack Platform

- Added the common domain and manifest contract for ten installable pack types.
- Added canonical SHA-256 manifests, Ed25519 trust verification, platform and
  runtime compatibility checks, approved-registry validation, and permission
  enforcement.
- Added tenant-scoped installation, activation, deactivation, dependency-safe
  removal, upgrade compensation, rollback, and immutable lifecycle history.
- Added readonly Capability Pack and Marketplace registries, four runtime
  registrations, two policies, one feature, and six lifecycle events.
- Added static architecture enforcement and lifecycle, security, tenant,
  signature, dependency, upgrade, and rollback tests.
- Adopted the Platform Maturity Model, Business Capability Model, Business
  Capability Lifecycle policy, and execution roadmap without claiming their
  unimplemented enforcement surfaces.

### Epic 2 - Business Query & Insight Layer

- Added graph-independent query, projection, view, factual insight, execution,
  result, pagination, streaming, and performance contracts.
- Added a readonly 14-query catalog covering executive, operations, customer,
  business, and execution contexts.
- Added reusable Projection and factual Insight services with version-aware
  query, projection, and context caches.
- Added semantic-version invalidation, query metrics, four event contracts,
  audit integration, registry metadata, and execution policy.
- Migrated workflow and agent preflight to BQIL while preserving prior guard
  names as deprecated compatibility aliases.
- Added an architecture rule preventing downstream services from importing
  Semantic Layer internals.
- Added full-catalog, deterministic cache, pagination, streaming, historical,
  tenant, event, audit, and performance integration tests.

### Epic 2 - Business Semantic Layer

- Added graph-independent semantic entities, relationships, contexts,
  projections, views, snapshots, dependency results, and lifecycle contracts.
- Added the Semantic Layer anti-corruption service, canonical context APIs,
  deterministic dependency resolution, eight registered views, semantic and
  projection caches, and graph-version invalidation.
- Moved workflow and agent execution preflight to Semantic Context while
  retaining deprecated compatibility class names.
- Registered the Semantic Layer feature, four runtime services, policy, view
  catalog, and four semantic events.
- Added an architecture rule preventing application services from importing
  graph infrastructure directly.
- Added end-to-end tenant, version, view, dependency, event, audit, memoization,
  historical reconstruction, and cache invalidation tests.

### Epic 2 - Business Knowledge Graph Foundation and Runtime

- Added the extensible Business Graph domain, centralized relationship
  taxonomy, deterministic Canonical Business Context projection, lifecycle,
  optimistic concurrency, immutable snapshots, and audit history.
- Added normalized PostgreSQL graph tables with RLS and composite tenant
  foreign keys, plus in-memory and PostgreSQL repository implementations.
- Added Graph Runtime lifecycle, version-pinned sessions, context resolution,
  deterministic traversal, structural validation, health metrics, and
  tenant/version-aware cache invalidation.
- Registered graph features, runtime services, policy, relationship types, and
  graph foundation/runtime events.
- Added execution preflight that requires published, context-synchronized
  graphs for workflow and agent use.
- Added graph journey, malformed-graph, cache invalidation, migration, and
  registry tests plus the eight requested architecture documents.

### Epic 2 - Canonical Business Discovery Foundation

- Added the canonical, extensible Business Context domain and authoritative
  service.
- Added tenant-scoped immutable context versions, lifecycle history,
  optimistic concurrency, migration `0012`, and RLS.
- Registered the feature, runtime, policy, and four discovery events.
- Added fail-closed Business Context guards for workflow and agent execution.
- Adopted Epic -> Capability -> Batch -> Certification as the permanent
  delivery model.

### OC1 Wave A - Identity Completion

- Added provider-backed browser signup, verification callback, sign-in,
  refresh, logout, and HTTP-only session cookies.
- Added durable organizations, memberships, active-tenant preferences, RLS,
  organization onboarding, and organization switching.
- Protected onboarding and dashboard routes with middleware presence checks
  plus server-side provider and membership verification.
- Added organization runtime and migration tests.
- Installed the approved full marketing landing page at `/landing.html`, routed
  `/` to it, and aligned application pages to its brand palette and typography.
- Completed browser password recovery, provider verification auditing, durable
  PostgreSQL identity/organization audit storage, and hardened tenant-preference
  RLS.
- Repaired Windows migration CLI execution so validation cannot silently
  report success without applying schemas.
- Closed Wave A as `GO With Environmental Blockers`; live Supabase,
  PostgreSQL, email, HTTPS, and browser evidence remain deployment work.

All notable changes to BOSS are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Outcome Chain 1 certification
- Audited Identity, Discovery and Diagnostic as one customer outcome.
- Recorded an evidence-based production `NO-GO`, including browser identity,
  Discovery Context, RLS, observability, dashboard and real TTFBV blockers.
- Explicitly blocked Outcome Chains 2 and 3 until the upstream production gate
  is satisfied.

### Added — Engine Program 03: Business Diagnostic Engine
- Added deterministic, configurable diagnostic synthesis across twelve
  business areas and nine maturity areas.
- Added evidence-backed root-cause, opportunity, priority and executive-summary
  models without introducing workflow execution.
- Added versioned PostgreSQL and in-memory diagnostic repositories, normalized
  migration `0010`, RLS policies, events, telemetry and dashboard projection.
- Added end-to-end diagnostic, tenant-boundary, dashboard and migration tests.

### Added — PI-2 architecture assessment
- Completed Phase 1 assessment for the proposed Business Capability Platform.
- Defined the non-colliding Business Outcome Plan integration model, dependency
  matrix, additive migration plan, risks, diagrams, implementation gates, and
  conditional certification.
- Preserved the architecture and MVP freezes; no PI-2 production code,
  migrations, registry entries, APIs, or UI were introduced.

### Added — MVP product freeze and first-value measurement
- Accepted ADR-0006, freezing the canonical registry, intelligence, execution,
  tenancy, event, repository, and migration architecture.
- Added the P0/P1/P2 MVP feature freeze and evidence-based journey baseline.
- Added durable, ordered Time to First Business Value instrumentation from
  landing through the first visible result.
- Added migration `0009_mvp_journey_metrics.sql` and in-memory/PostgreSQL
  journey stores.
- Added tests for stage ordering, idempotency, target calculation, persistence,
  and migration structure.

### Added — Production platform completion pass
- `apps/api`: `createApiFromContainer()` and `createInMemoryApi()` for
  verified non-Postgres workflows, demos, tests, and future UI adapters.
- `apps/api`: production certification utilities for tenant-scoped RBAC
  checks, structured audit events, trace IDs, operation metrics, and
  runtime health/environment diagnostics.
- `apps/api`: persistent local development health server for `pnpm --filter
  @boss/api dev`.
- `apps/web`: replaced the placeholder entrypoint with a typed BOSS Command
  Center snapshot builder, accessible responsive HTML renderer, and an
  end-to-end demo workflow that exercises business setup, MRI, DNA, health,
  capabilities, constraints, recommendations, approval, roadmap, and
  timeline through the real API services.
- `apps/web`: Next.js App Router foundation (`app/`, `next.config.mjs`,
  loading state, error boundary, global styles) with `next dev` and
  `next build` scripts.
- `packages/ui`: shared dashboard formatting and tone helpers for currency,
  counts, percentages, labels, scores, and priorities.
- Tests for the command center workflow and shared UI helpers.
- Tests for production certification utilities.

### Added — Goal 4: Recommendation Intelligence Engine
- `packages/registries`: `recommendationCategoryRegistry` (13 categories)
  and `recommendationDefinitionRegistry` with declarative
  `triggerConstraintKeys`, fixed `RecommendationRoiModel`, and Approval
  Model (`auto`/`approval_required`/`executive_review`/`manual_only`).
- `industry-packs/general-smb`: 15-item General SMB Recommendation
  Library across 13 categories; pack version bumped to `0.4.0`.
- `packages/mcp`: `recommendationEngine.ts` — constraint-triggered
  derivation (`generateRecommendations`), deterministic weighted scoring
  (`prioritizeRecommendations`), and 5-stage Transformation Roadmap
  grouping (`buildTransformationRoadmapStages`), with scaled,
  non-hallucinated ROI estimation.
- `packages/db`: raw SQL migrations (11 tables) for Recommendation
  Registry/Instances/Evidence/ROI Estimates/Scores/Priorities/
  Constraint Links/Transformation Roadmaps/Stages/History, executed and
  verified against a live Postgres 16 instance; dual Postgres +
  in-memory repository adapters.
- `apps/api`: `businessRecommendationService`/
  `businessRecommendationController` for analysis, scoring,
  prioritization, roadmap retrieval, listing, dismissal, and approval;
  end-to-end integration test.
- `docs/adr/0005-recommendation-intelligence-engine.md`.
- Tech Debt Register: TD-011, TD-012.

### Added — Goal 3: Constraint Intelligence Engine
- `packages/registries`: `constraintCategoryRegistry` (13 categories) and
  `constraintDefinitionRegistry` with a declarative
  `ConstraintDetectionRule` union and fixed `ConstraintImpactModel`.
- `industry-packs/general-smb`: 20-item General SMB Constraint Library
  with registry-driven detection rules; `installGeneralSmbPack()` made
  idempotent; pack version bumped to `0.3.0`.
- `packages/mcp`: `constraintEngine.ts` — deterministic, registry-driven
  constraint detection (`detectConstraints`) and weighted priority scoring
  (`prioritizeConstraints`), with scaled, non-hallucinated impact
  estimation.
- `packages/db`: raw SQL migrations (8 tables) for Constraint Registry/
  Instances/Evidence/Categories/Relationships/History/Scores/Priorities,
  executed and verified against a live Postgres 16 instance; dual
  Postgres + in-memory repository adapters.
- `apps/api`: `businessConstraintService`/`businessConstraintController`
  for detection, scoring, prioritization, listing, and dismissal; now
  depends on `@boss/industry-pack-general-smb` and installs it at
  container-construction time; end-to-end integration test.
- `docs/adr/0004-constraint-intelligence-engine.md`.
- Tech Debt Register: TD-009, TD-010.

### Added — Goal 2: Business Intelligence Layer
- `packages/db`: raw SQL migrations (11 tables) for Business MRI/DNA/Health/
  Capabilities/Timeline, executed and verified against a live Postgres 16
  instance; migration runner (`migrate.ts`) and validator
  (`validateMigrations.ts`); dual Postgres + in-memory repository adapters
  behind shared interfaces.
- `packages/mcp`: deterministic, non-AI derivation functions
  (`deriveBusinessDna`, `deriveBusinessHealth`, `evaluateCapabilities`).
- `apps/api`: typed services and logic-free controllers for Business
  Profile, MRI, DNA, Health, Capabilities, and Timeline, wired through a
  repository container; end-to-end integration test.
- `docs/adr/0003-business-intelligence-layer.md`.
- Tech Debt Register: TD-007, TD-008; updated TD-001–TD-006 to reflect
  Goal 2 progress.

### Added — Goal 0.5: Engineering Operating System + Core Business Foundation
- Engineering governance: `CONTRIBUTING.md`, `CODEOWNERS`, Definition of
  Done, Coding Standards, Technical Debt Register, Project Health
  Dashboard, ADR process (`docs/adr`).
- GitHub governance: PR template, bug/feature/architecture-proposal issue
  templates.
- CI: lint, typecheck, build, test, and dependency-audit GitHub Actions
  workflow.
- Architecture validation: `dependency-cruiser` boundary/circular-dependency
  checks and `knip` dead-code detection, both wired into CI as `pnpm arch:check`.
- Canonical Business Ontology and Business Graph
  (`packages/types/src/ontology.ts`, `docs/architecture/BUSINESS_ONTOLOGY.md`,
  `docs/architecture/BUSINESS_GRAPH.md`).
- Eight declarative registries in `packages/registries` (capability,
  constraint, KPI, AI employee, workflow, prompt, policy, event).
- Core Business Capability Pack (`industry-packs/general-smb`) populated
  with reusable capabilities, constraints, KPIs, AI employees, workflows,
  and prompts, validated by cross-reference tests.

## [0.1.0] — Goal 0: Repository Normalization
### Added
- pnpm + Turborepo monorepo scaffold: `apps/web`, `apps/api`,
  `packages/{ui,types,config,mcp,loop,events,registries,shared}`,
  `industry-packs/general-smb`, `docs/{architecture,product,execution,adr}`.
- Shared strict TypeScript config, flat ESLint config, Prettier.
- Canonical docs (`README.md`, `CLAUDE.md`, `docs/architecture/ARCHITECTURE.md`,
  `docs/execution/SKILL.md`) sourced from the original BOSS package.
