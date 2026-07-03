# Changelog

## RC1.5 — Enterprise Reliability & Platform Verification (2026-07-03)

### 7 New Workstream Test Files (85 new tests, total: 474 passing)

- **WS1 E2E Lifecycle** (`rc15_e2e_business_lifecycle.test.ts`) — Exercises full pipeline: Business → MRI → Health → Constraints → Recommendations → Decisions → Executive Brief → Loop Execution → Mission Control. Verifies domain events at each stage.
- **WS2 Integration Audit** (`rc15_integration_audit.test.ts`) — Static code analysis verifying MCP/Loop boundary, no repository bypasses, no provider adapter leakage. 0 violations.
- **WS3 Resilience Matrix** (`rc15_resilience_matrix.test.ts`) — Provider outage degradation, JWT expiry/tampering, tenant mismatch, worker failure recovery, dead-letter persistence, event log idempotency.
- **WS4 Load Validation** (`rc15_load_validation.test.ts`) — 100 businesses, 1000 workflows, 10000 events, 500 tasks — all within time budgets with bounded memory growth.
- **WS5 Decision Quality** (`rc15_decision_quality.test.ts`) — Cross-industry determinism (retail, restaurant, professional_services), recommendation traceability, decision explainability, executive brief persistence.
- **WS6 Security Validation** (`rc15_security_validation.test.ts`) — 14 tenant isolation and RBAC tests across all repos. Cross-org reads return empty/null. JWT hierarchy enforced.
- **WS7 Operational Readiness** (`rc15_operational_readiness.test.ts`) — Health/metrics HTTP endpoints, scheduler diagnostics, Mission Control dead letter visibility, tool execution audit trail.

### Documentation
- `docs/RC1_5_ENTERPRISE_RELIABILITY_REPORT.md`
- `docs/RC1_5_INTEGRATION_MATRIX.md`
- `docs/RC1_5_LOAD_TEST_REPORT.md`
- `docs/RC1_5_SECURITY_VALIDATION.md`
- `docs/RC1_5_OPERATIONAL_READINESS.md`
- `docs/RC1_5_PLATFORM_CERTIFICATION.md`

## Unreleased

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

### Added — RC1 Production Infrastructure

- **WS1 — Provider Adapters**: `googleCalendarAdapter.ts` (Google Calendar API v3, schedule_appointment); `quickbooksAdapter.ts` (QuickBooks Online API v3, create_invoice). Adapter count: 8 real HTTP, 10 still simulated. TD-013 further narrowed.
- **WS2 — Secret Versioning**: `SecretVersion` type + `listVersions()` method added to `SecretStore` interface; `EncryptedInMemorySecretStore` now tracks rotation history with version counter, timestamp, and actor; `EnvSecretStore.listVersions()` returns empty (read-only)
- **WS3 — Scheduler Completion**: `computeNextCronRun(expression, after)` — 5-field cron parser (star, star/n, values, comma lists) with up-to-1-year lookahead; `runDue()` now computes nextRunAt for cron jobs after each successful execution; `recoverFailed(orgId, businessId)` re-queues failed jobs with exponential backoff (2^runCount minutes, max 60m)
- **WS4 — Durable Event Log**: Migration `0017_event_log.sql`; `EventLogEntry` type + `EventLogRepository` interface (`append/listByType/listByOrgId/listByCorrelationId/listSince`); in-memory + postgres implementations; `createDurableEventBus(inner, sink)` wraps any EventBus and persists every published event to a sink before dispatching; both containers now use DurableEventBus; `EventLogRepository` added to `RepositoryContainer`
- **WS5 — Production Auth (RBAC)**: `UserRole` type (`owner | admin | member | viewer`); `requireRole(req, minRole)` enforces minimum role level from `role` JWT claim; `mintDevToken` now accepts optional role param; backward-compatible (tokens without role claim default to owner)
- **RC1 Documentation**: `RC1_PRODUCTION_READINESS_REPORT.md`, `RC1_SECURITY_ASSESSMENT.md`, `RC1_OPERATIONAL_READINESS.md`, `RC1_DEPLOYMENT_GUIDE.md`, `RC1_ARCHITECTURE_CONVERGENCE.md`
- **Test suite**: 23 test files, 114 tests, all passing

### Added — Decision Intelligence Operating System (Goals 21–23)

- **Goal 21 — Decision Intelligence Core**: `BusinessDecision` ontology type with full lifecycle (draft→generated→approved→rejected→scheduled→executing→completed→measured→archived); `businessDecisionService` with `generate/evaluate/approve/reject/schedule/measure/archive/list/getOptimizationReport/getPriorityRanking`; `decisionEngine.ts` (MCP — deterministic decision generation from health+constraints+recommendations); `decisionOptimization.ts` (MCP — optimization signals: repeated_failure, successful_strategy, decision_drift, execution_bottleneck, missed_opportunity); learning loop: `measure()` persists outcomes to `memoryRecords` with key `decision:{id}:outcome`; migration `0015_decisions.sql`; `BusinessDecisionRepository` (postgres + in-memory)
- **Goal 22 — Scenario Simulation Engine**: `BusinessScenario` + `ScenarioComparison` ontology types; `scenarioEngine.ts` (MCP — deterministic math per scenario type: revenue/marketing/hiring/pricing/expansion/finance); `calculateScenario/generateForecast/compareScenarios` functions; `scenarioService` with `create/list/compare/getForecast`; multi-period forecast (30d/90d/180d/365d) with confidence decay; `scenario.created` + `scenario.compared` domain events; migration `0016_scenarios.sql`; `BusinessScenarioRepository` (postgres + in-memory)
- **Goal 23 — Executive Decision Intelligence**: `executiveBrief.ts` (MCP — Claude-powered or deterministic fallback when no API key); `generateExecutiveBrief` produces executiveSummary, businessHealthSummary, topOpportunities, risks, nextActions; `getExecutiveBrief` persists summary back to decision record; `MissionControlSnapshot` extended with `decisions: DecisionQueueSummary` and `activeScenarios`; ADR-0018; 3 certification docs; 22 new tests (Goals 21–23)
- **TD-028 resolved**: Zod request body validation on all mutating HTTP routes; `validate<S extends z.ZodTypeAny>()` generic correctly infers output types for `.default()` fields; auth-before-validation ordering preserves 401 on unauthenticated requests
- **TD-024 resolved**: Claude API LLM inference in AI Employee runtime via `runAiEmployeeInference()`; inference gated on `ANTHROPIC_API_KEY` for deterministic tests

### Added — Super Batch B (Goals 17–20): Enterprise Production Platform

- **Goal 17 — Enterprise Scheduler**: `scheduler_jobs` table (migration 0014); `SchedulerJob` type + `SchedulerJobRepository` (postgres + in-memory); `SchedulerService` with `scheduleImmediate/scheduleDelayed/scheduleCron/cancel/listPending/runDue`; `timeoutMs` on `StepSpec` with `Promise.race` timeout enforcement (TD-018 resolved); `ParallelStepGroup` type + `StepEntry` union for fan-out/fan-in parallel execution (TD-019 resolved); `isParallelGroup()` type guard; `LoopRuntimeService.execute()` upgraded to `StepEntry[]`
- **Goal 18 — Observability**: `ObservabilityService` with 7 domain-event-driven counters and P50/P95 latency ring buffer; `requestTracing` middleware propagates `x-trace-id` header; `GET /health` (unauthenticated); `GET /api/v1/metrics` (authenticated); event subscriptions auto-increment counters for workflow, tool, scheduler, circuit breaker, and evidence events
- **Goal 19 — Multi-Agent Runtime**: `multiAgentPlanner.ts` (MCP intelligence — `planMultiAgentTask` matches available employees to capabilities, groups parallel workers); `multiAgentReflection.ts` (MCP intelligence — deterministic ≥80% success threshold, `ReflectionResult` with failedSteps + nextActions); `MultiAgentRuntimeService` (apps/api coordinator — Plan → StepEntry[] with ParallelStepGroups → Loop execution → reflection); domain events `multi_agent.plan.created/execution.completed/reflection.completed`
- **Goal 20 — Production Certification**: Full convergence audit; ADR 0017; TD-017/018/019 resolved, TD-020 narrowed; 16 test files, 68 tests all passing
- TD-017 resolved, TD-018 resolved, TD-019 resolved, TD-020 narrowed

### Added — Super Batch A (Goals 16A–16C): Production Execution Platform

- **Goal 16A — Provider Adapter Foundation**: `ProviderErrorCode` enum + `mapProviderError` + `isRetryableErrorCode` (`errorMapping.ts`); `ProviderEvidence` ontology type + `ProviderEvidenceRepository` (postgres + in-memory); migration `0013_provider_evidence.sql`; error classification wired into retry decision and dispatcher catch
- **Goal 16B — Secret Vault**: `SecretStore` interface (`get/put/rotate/delete/audit`); `EnvSecretStore` (dev read-only, env-var backed); `EncryptedInMemorySecretStore` (AES-256-GCM, per-orgId tenant isolation, rotation, audit trail, key from `SECRET_VAULT_KEY`); `CredentialResolver` rewritten to use `SecretStore`; `tool.credentials.accessed` event emitted; `secretStore` + `providerEvidence` fields added to `RepositoryContainer`
- **Goal 16C — Production Adapters**: Real HTTP adapters for Twilio (already done), MessageBird, Gmail, Microsoft 365, Slack, and Teams — all with injectable `fetch` for testability and `ProviderErrorCode` error classification. 13 remaining providers still use the simulated fallback.
- 18 new tests (46 total); full workspace `typecheck/build/lint/arch:check` green
- `docs/adr/0016-super-batch-a-production-execution-platform.md`
- TD-013 further narrowed (6/19 providers real); TD-014 partially resolved (SecretStore abstraction exists)

### Added — Goal 16: Production Provider Adapter Framework

- `apps/api/src/services/providerAdapters/` (new module): production adapter
  dispatch pipeline — `ProviderAdapter` interface, `CredentialResolver` (env-var
  placeholder, TD-014 deferred to Goal 17), `CircuitBreaker` (per-provider
  in-process, three-state), `RetryPolicy` (`withRetry` with injectable sleep),
  `AdapterRegistry`, `TwilioSmsAdapter` (real Twilio REST API, injectable fetch),
  and `dispatcher.ts` combining all of the above.
- `toolFabricService.requestTool()`: the `executeToolRequestSimulated` call is now
  replaced by `dispatchProviderExecution()`, which routes registered providers
  through the real adapter pipeline (Twilio) and falls back to simulation for
  all others. `latencyMs` is now persisted to `provider_health` from real timings.
- `ToolExecution` ontology type: added `attemptCount: number` and
  `latencyMs: number | null` fields.
- `ToolExecutionRepository.updateStatus`: new optional `meta` parameter persists
  attempt count and latency; both postgres and in-memory implementations updated.
- `IntegrationAccountRepository`: added `findCredentialByAccount` (was missing
  from the interface and both implementations despite the DB table existing).
- Migration `0012_tool_execution_telemetry.sql`: `attempt_count integer NOT NULL
  DEFAULT 1`, `latency_ms numeric` on `tool_executions`.
- New domain events (emitted from dispatcher): `tool.provider.resolved`,
  `tool.credentials.resolved`, `tool.execution.started`, `tool.execution.succeeded`,
  `tool.execution.failed`, `tool.provider.unavailable`, `tool.retry.scheduled`,
  `tool.circuit.opened`, `tool.circuit.closed`.
- `apps/api/src/__tests__/providerAdapterFlow.test.ts` (new): 9 tests covering
  Twilio success/failure/bad-credential/network-error, circuit-breaker open/close/
  half-open, retry policy, and missing-credential integration path.
- `docs/adr/0015-production-provider-adapter-framework.md`.
- Tech Debt: TD-013 narrowed (Twilio has a real adapter); TD-014 remains open.

### Added — Goal 15: Auth Hardening (JWT verification)
- `apps/api/src/http/auth.ts` (new): `requireOrgId(req)` is now async and
  verifies a Supabase-style HS256 JWT (`Authorization: Bearer <token>`)
  against `SUPABASE_JWT_SECRET` via `jose`, extracting tenancy from the
  token's `org_id` claim instead of a raw `x-org-id` header. All ~30
  existing route call sites updated to `await requireOrgId(req)`.
- `apps/api/src/http/apiError.ts` (new): `ApiError` extracted out of
  `server.ts` so `auth.ts` can throw it too.
- `POST /api/v1/auth/dev-token` (new, non-production only): mints a
  signed token for a given `orgId`, standing in for what a real Supabase
  custom access-token hook would issue at sign-in — there is still no
  login UI (TD-030).
- `apps/api/src/server.ts`: requires `SUPABASE_JWT_SECRET` in production;
  defaults to an obviously-fake dev value otherwise.
- `apps/web/src/lib/apiClient.ts`: exchanges `DEMO_ORG_ID` for a dev token
  before each request and sends it as a bearer token instead of an
  `x-org-id` header.
- `apps/api/src/__tests__/httpServerFlow.test.ts`: updated to mint and use
  a real signed token instead of the header.
- `docs/adr/0014-jwt-auth-verification.md`.
- Tech Debt Register: TD-027 resolved; TD-006 narrowed; TD-030 added.

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
- Added migration `0019_mvp_journey_metrics.sql` and in-memory/PostgreSQL
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
