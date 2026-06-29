# Changelog

All notable changes to BOSS are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added — Goal 14: Web Application
- `apps/web` is now a real Next.js 14 App Router app (Tailwind 3, dark
  theme, Syne/DM Sans, `#C8102E` accent per CLAUDE.md) instead of a
  one-line placeholder. Three routes: `/` (landing), `/business/new`
  (Business Setup form), `/business/[businessId]/mission-control` (reads
  the Goal 13 Mission Control endpoint) — a thin, fully-working vertical
  slice rather than the full page set originally described by TD-001.
- `apps/web/src/lib/apiClient.ts` (new): thin typed fetch wrapper over the
  Goal 13 HTTP API, mirroring `ApiClientError` onto the API's error
  envelope so pages can render real error states.
- `apps/web/src/lib/demoOrg.ts` (new): `DEMO_ORG_ID` placeholder mirroring
  the HTTP layer's `x-org-id` placeholder (TD-006).
- Designed loading/empty/error states per CLAUDE.md's UI conventions on
  both pages.
- `docs/adr/0013-web-application-scaffold.md`.
- Tech Debt Register: TD-001 narrowed (not resolved); TD-029 added.

### Added — Goal 13: Customer-Facing HTTP API
- `apps/api/src/http/server.ts` (new): `createHttpServer(api)` — thin
  Express transport mapping every existing controller method onto a REST
  route under `/api/v1` (`/api/v1/{context}/{resource}` convention from
  CLAUDE.md), uniform `{ code, message, details, traceId }` error envelope,
  tenancy read from an `x-org-id` header (placeholder for JWT-derived
  org_id — no auth system exists yet, TD-006/TD-027).
- `apps/api/src/server.ts` (new): process entrypoint (`app.listen()`),
  separate from the testable `createHttpServer`.
- `apps/api/src/index.ts`: `createApi()` split into `createApi()`
  (Postgres) and `createApiFromContainer(repos)` (container-agnostic), so
  the HTTP layer can be tested against `createInMemoryContainer()`.
- `apps/api/package.json`: added `express`/`@types/express`; `dev` now
  runs `src/server.ts`, new `start` script runs the built server.
- `apps/api/src/__tests__/httpServerFlow.test.ts` (new) — missing-header
  401, unmatched-route 404 envelope, full create→fetch round trip, and the
  Mission Control snapshot route, all exercised against a real listening
  HTTP server.
- `docs/adr/0012-customer-facing-http-api.md`.
- Tech Debt Register: TD-002 resolved; TD-027, TD-028 added.

### Added — Goal 12: Mission Control
- `apps/api/src/services/missionControlService.ts` (new): read-only
  projection assembling a `MissionControlSnapshot` (`workflows` enriched
  with their `tasks`/`events`, `deadLetters`, `timeline`) from existing
  durable repositories — owns no state, performs no writes, never queries
  the in-memory `EventBus`.
- `apps/api/src/controllers/missionControlController.ts` (new): one-method
  pass-through controller (`getSnapshot`), matching the existing controller
  convention.
- `apps/api/src/index.ts`: `createApi()` now returns a `missionControl`
  field built from the new service/controller.
- `apps/api/src/__tests__/missionControlFlow.test.ts` (new) — runs a full
  business → MRI → constraints → recommendation → workflow-generation flow
  and asserts the snapshot reflects the resulting workflow execution
  (with tasks/events), timeline entry, and dead letters.
- `docs/adr/0011-mission-control-projections.md`.
- Tech Debt Register: TD-026.

### Added — Goal 11: AI Employee Runtime
- `packages/mcp/src/intelligence/aiEmployeeRuntime.ts` (new):
  `decideAiEmployeeAction()` — deterministic decision over
  `aiEmployeeRegistry` data; returns `{kind: "execute", toolRequest}` when
  an employee is `"available"` and has the requested capability, or
  `{kind: "escalate", reason}` otherwise. Performs no I/O.
- `apps/api/src/services/loopRuntimeService.ts`: the `"ai"` task type is no
  longer a stub — its handler calls `decideAiEmployeeAction()`, delegates
  `"execute"` decisions to `toolFabric.requestTool()`, records a
  `last_execution:<capabilityKey>` memory record, and publishes
  `ai_employee.task.completed`/`.failed`/`ai_employee.escalation.triggered`.
- `packages/types/src/ontology.ts`: `MemoryRecord` gained `businessId`,
  `createdAt`, `updatedAt`.
- `packages/db`: new `MemoryRecordRepository` (in-memory + Postgres),
  migration `0011_ai_employee_memory.sql` (`memory_records` table), wired
  onto `RepositoryContainer.memoryRecords`.
- `apps/api/src/__tests__/aiEmployeeRuntimeFlow.test.ts` (new) — execute
  path (capability resolved through Tool Fabric, memory recorded) and
  escalate path (capability not granted to the employee).
- `docs/adr/0010-ai-employee-runtime.md`.

### Added — Goal 10: Autonomous Workflow Generator
- `packages/mcp/src/intelligence/workflowGenerator.ts` (new):
  `generateWorkflowGraph()` transforms a `BusinessRecommendation` into an
  executable step graph — one `"tool"` step per `relatedCapabilities`
  entry — using a locally-defined structurally-identical shape to
  `@boss/loop`'s `StepSpec` so MCP never imports from Loop.
- `apps/api/src/services/workflowGenerationService.ts` (new):
  `generateAndExecute()` looks up the recommendation, generates the graph,
  records a `workflow_generated` timeline entry, publishes
  `workflow.generated`/`workflow.completed`/`workflow.failed`, and runs the
  graph through `loopRuntimeService`.
- `apps/api/src/index.ts`: subscribes to `business.recommendation.approved`
  and auto-triggers `workflowGeneration.generateAndExecute()`, fully
  decoupling approval from execution.
- `apps/api/src/services/loopRuntimeService.ts`: hardened the `"tool"`
  handler with a try/catch around `toolFabric.requestTool()` so an
  unresolvable capability fails one step gracefully instead of throwing
  uncaught through the Loop Runtime's `runStep()`.
- `packages/types/src/ontology.ts`: `TimelineEventType` gained
  `"workflow_generated"`.
- `apps/api/src/__tests__/workflowGenerationFlow.test.ts` (new) — approve →
  generate → execute flow, plus the event-driven auto-trigger path.
- `docs/adr/0009-autonomous-workflow-generator.md`.

### Added — Goal 9: Domain Event Backbone
- `apps/api/src/container.ts`: `RepositoryContainer` gained a shared
  `eventBus: EventBus` field constructed once per container, so every
  service built from the same container publishes onto the same bus.
- `apps/api/src/services/loopRuntimeService.ts`: now consumes
  `repos.eventBus` instead of constructing its own independent instance,
  making the bus a genuine single backbone across Loop Runtime and
  domain-level events.
- `apps/api/src/services/{businessMriService,businessHealthService,
  businessConstraintService,businessRecommendationService,
  toolFabricService}.ts`: each now calls `eventBus.publish(...)` with a
  canonical `{context}.{entity}.{verb}` event (`business.mri.started`,
  `business.mri.completed`, `business.health.calculated`,
  `business.constraints.analyzed`, `business.constraint.dismissed`,
  `business.recommendations.generated`, `business.recommendation.approved`,
  `tool.execution.requested`, `tool.execution.succeeded`/`.failed`)
  alongside their existing durable timeline/audit writes.
- `apps/api/src/__tests__/domainEventsFlow.test.ts` (new) — asserts all ten
  canonical events fire across a full business → MRI → Health →
  Constraints → Recommendations → Tool Fabric flow.
- `docs/adr/0008-domain-event-backbone.md`.

### Added — EP-1 Batch 5 prerequisite: Loop Runtime core
- `packages/loop`: real execution engine replacing the prior
  interface-only skeleton — `stateMachine.ts` (11-state machine with
  transition guard), `taskHandlerRegistry.ts` (function-based handler
  registry keyed by `TaskType`), `ports.ts` (persistence-agnostic
  repository-shaped interfaces), `runtime.ts`
  (`createLoopRuntime().execute()`: sequential step execution, retry,
  dead-letter on exhausted retries, reverse-order compensation rollback,
  dual-channel event emission).
- `packages/events`: `createInMemoryEventBus()` — first real `EventBus`
  implementation; fixed a circular import between `index.ts` and the new
  `inMemoryEventBus.ts` by extracting interfaces into `eventBus.ts`.
- `packages/types`: `ExecutionState`, `TaskType`, `WorkflowExecution`,
  `TaskExecution`, `ExecutionEventRecord`, `DeadLetterEntry`.
- `packages/db`: migration `0010_loop_runtime.sql`
  (`workflow_executions`, `task_executions`, `execution_events`,
  `dead_letter_queue`), dual Postgres + in-memory repository adapters.
- `apps/api`: `loopRuntimeService.ts` wiring the `"tool"` task handler to
  `toolFabricService.requestTool()`; `container.ts` extended with the
  four new repositories; 4-test end-to-end suite
  (`loopRuntimeFlow.test.ts`).
- `docs/adr/0007-loop-runtime.md`.

### Added — Goal 8: Business Tool & Integration Fabric
- `packages/registries`: `capabilityContractRegistry` (12 capabilities),
  `providerDefinitionRegistry` (19 providers), `toolDefinitionRegistry`
  (12 tools) — capability/provider/tool kept as three separate
  registries so AI Employees only ever reference capabilities.
- `industry-packs/general-smb`: seeds all three registries via
  `seedToolFabric()`; pack version bumped to `0.5.0`.
- `packages/mcp`: `intelligence/toolFabric.ts` —
  `resolveCapability()` (provider resolution scoped to currently
  connected integrations, permission validation with safe
  `approval_required` default) and `executeToolRequestSimulated()` (no
  real network call — Law 1).
- `packages/db`: raw SQL migrations (9 tables) for Capability/Provider/
  Tool Registry, Integration Accounts, Credential References
  (references only, never raw secrets), Permission Policies, Tool
  Executions, Provider Health, Tool Audit History, executed and
  verified against a live Postgres 16 instance; dual Postgres +
  in-memory repository adapters.
- `apps/api`: `toolFabricService`/`toolFabricController` for
  connect/disconnect integration, permission policies, tool resolution +
  simulated execution + audit + health tracking; end-to-end integration
  test.
- `docs/adr/0006-tool-integration-fabric.md`.
- Tech Debt Register: TD-013, TD-014, TD-015, TD-016.

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
