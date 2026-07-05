# PLATFORM INVENTORY
> Generated: 2026-07-05 | Branch: rc2/project-renaissance

---

## Monorepo Structure

```
BOSS-AI-/
├── apps/
│   ├── api/          — Fastify HTTP API (port 4000)
│   └── web/          — Next.js 14 App Router (port 3000)
├── packages/
│   ├── capabilities/ — Capability pack platform
│   ├── config/       — Shared ESLint + TypeScript configs
│   ├── db/           — Postgres repositories + migrations
│   ├── events/       — EventBus interface + in-memory + durable implementations
│   ├── loop/         — Canonical Automation Runtime (BossRuntime)
│   ├── mcp/          — Master Control Platform (all intelligence)
│   ├── registries/   — All canonical registries (50+ registries)
│   ├── shared/       — Utility functions
│   ├── types/        — Shared TypeScript types
│   └── ui/           — Shared UI utilities
└── industry-packs/
    ├── accounting, cleaning, coffee-shop, dental
    ├── general-smb, home-care, home-services
    ├── landscaping, legal, restaurant, retail
```

---

## Frontend — apps/web

### App Router Pages
| Route | Purpose | Client Component |
|-------|---------|-----------------|
| `/` | Landing page (11 sections) | `page.tsx` |
| `/waitlist` | Waitlist sign-up | `page.tsx` |
| `/auth/sign-in` | Email + Google sign-in | `page.tsx` |
| `/auth/sign-up` | Email + Google registration | `page.tsx` |
| `/auth/callback` | OAuth PKCE + magic link handler | `page.tsx` (client) |
| `/auth/forgot-password` | Password reset request | `page.tsx` |
| `/auth/reset-password` | Set new password | `page.tsx` |
| `/auth/verify` | Email verification message | `page.tsx` |
| `/onboarding/organization` | Create org on first sign-in | `page.tsx` |
| `/onboarding/setup` | Business setup wizard | `OnboardingSetupClient.tsx` |
| `/dashboard` | Multi-business command center | `DashboardClient.tsx` |
| `/businesses` | Business list | `BusinessListClient.tsx` |
| `/business/new` | Create business form | `NewBusinessClient.tsx` |
| `/business/[id]/health` | Business health overview | `HealthClient.tsx` |
| `/business/[id]/mri` | Market Readiness Index survey | `MriClient.tsx` |
| `/business/[id]/mission-control` | Executive command center | `page.tsx` |
| `/business/[id]/workspace/*` | Workspace OS modules (see below) | varies |
| `/marketplace` | Template/pack browser | `MarketplaceClient.tsx` |
| `/ops` | Internal ops dashboard | `page.tsx` |
| `/cs` | Internal CS dashboard | `page.tsx` |

### Workspace OS Modules
| Module | Path | OS |
|--------|------|-----|
| Overview | `/workspace` | — |
| Customers | `/workspace/customers` | Customer OS |
| Jobs | `/workspace/jobs` | Work OS |
| Appointments | `/workspace/appointments` | Work OS |
| Invoices | `/workspace/invoices` | Money OS |
| Payments | `/workspace/payments` | Money OS |
| Reviews | `/workspace/reviews` | Customer OS |
| Analytics | `/workspace/analytics` | Intelligence OS |
| Decisions | `/workspace/decisions` | Decision OS |
| Scenarios | `/workspace/scenarios` | Decision OS |
| Workflows | `/workspace/workflows` | Automation |
| Automation | `/workspace/automation` | Automation |
| Recommendations | `/workspace/recommendations` | Intelligence OS |
| Approvals | `/workspace/approvals` | Decision OS |
| Timeline | `/workspace/timeline` | Intelligence OS |
| Money | `/workspace/money` | Money OS |
| Work | `/workspace/work` | Work OS |
| Operations | `/workspace/operations` | Work OS |
| Intelligence | `/workspace/intelligence` | Intelligence OS |
| Settings | `/workspace/settings` | Platform |

### Next.js API Routes (BFF)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/sign-in` | POST | Email/password sign-in → cookie |
| `/api/auth/sign-up` | POST | Registration |
| `/api/auth/sign-out` | POST | Clear session cookie |
| `/api/auth/session` | POST | Exchange tokens → httpOnly cookie |
| `/api/auth/refresh` | POST | Refresh session |
| `/api/auth/token` | GET | Return raw token for API calls |
| `/api/auth/forgot-password` | POST | Trigger reset email |
| `/api/auth/reset-password` | POST | Apply new password |
| `/api/organizations` | GET/POST | List/create orgs |
| `/api/organizations/switch` | POST | Switch active org |
| `/api/recommendations/[id]/approve` | POST | Approve recommendation |
| `/api/recommendations/[id]/dismiss` | POST | Dismiss recommendation |
| `/api/waitlist` | POST | Waitlist registration |

### Auth
- Supabase Auth (email/password + Google OAuth PKCE)
- Middleware (`middleware.ts`) — session guard on protected routes
- `supabaseBrowser.ts` — singleton browser Supabase client
- `GoogleSignInButton.tsx` — PKCE OAuth trigger component

---

## Backend — apps/api

### HTTP Server
- Fastify 4 (`src/http/server.ts`)
- Auth middleware: `src/http/auth.ts` (Supabase JWT validation)
- Telemetry middleware: `src/http/telemetry.ts` (OpenTelemetry)
- Validation: `src/http/validation.ts` (Zod)
- Error handling: `src/http/apiError.ts`

### Controllers
| Controller | Routes Owned |
|-----------|-------------|
| `businessController` | `/api/v1/businesses/*` |
| `businessHealthController` | `/api/v1/businesses/:id/health` |
| `businessMriController` | `/api/v1/businesses/:id/mri` |
| `businessDnaController` | `/api/v1/businesses/:id/dna` |
| `businessDiagnosticController` | `/api/v1/businesses/:id/diagnostic` |
| `businessRecommendationController` | `/api/v1/businesses/:id/recommendations` |
| `businessCapabilityController` | `/api/v1/businesses/:id/capabilities` |
| `businessConstraintController` | `/api/v1/businesses/:id/constraints` |
| `businessTimelineController` | `/api/v1/businesses/:id/timeline` |
| `analyticsController` | `/api/v1/businesses/:id/analytics` |
| `appointmentController` | `/api/v1/businesses/:id/appointments` |
| `customerController` | `/api/v1/businesses/:id/customers` |
| `invoiceController` | `/api/v1/businesses/:id/invoices` |
| `jobController` | `/api/v1/businesses/:id/jobs` |
| `paymentController` | `/api/v1/businesses/:id/payments` |
| `reviewController` | `/api/v1/businesses/:id/reviews` |
| `missionControlController` | `/api/v1/businesses/:id/mission-control` |
| `toolFabricController` | `/api/v1/tools/*` |

### Services (48 total)
| Service | Purpose |
|---------|---------|
| `aiWorkforceService` | AI employee orchestration |
| `analyticsService` | Analytics aggregation |
| `appointmentService` | Appointment CRUD + scheduling |
| `betaInviteService` | Beta waitlist management |
| `bteService` | Business Transformation Engine coordinator |
| `businessCapabilityService` | Capability pack install/activate |
| `businessConstraintService` | Constraint detection + scoring |
| `businessContextService` | Context publish + versioning |
| `businessDecisionService` | Decision record management |
| `businessDiagnosticService` | Diagnostic session management |
| `businessDnaService` | DNA profile management |
| `businessGoalService` | Goal setting + tracking |
| `businessGraphRuntime` | Knowledge graph traversal |
| `businessGraphService` | Knowledge graph CRUD |
| `businessHealthService` | Health score calculation |
| `businessMriService` | MRI survey management |
| `businessOperatingLoopService` | BTE intelligence cycle (MCP-delegating) |
| `businessProfileService` | Profile CRUD |
| `businessQueryService` | BQIL query execution |
| `businessRecommendationService` | Recommendation CRUD + scoring |
| `businessSemanticLayer` | Semantic context projection |
| `businessTimelineService` | Timeline event logging |
| `customerHealthService` | Customer health scoring |
| `customerService` | Customer CRUD |
| `executionPlanService` | Plan generation + safe-auto-execute gate |
| `executiveBriefingService` | Executive brief generation |
| `featureFlagService` | Feature flag evaluation |
| `insightService` | Business insight generation |
| `invoiceService` | Invoice CRUD + status management |
| `jobService` | Job CRUD + lifecycle |
| `kpiMeasurementService` | KPI derivation + persistence |
| `loopRuntimeService` | Loop task handler wiring |
| `marketplaceService` | Marketplace template browser |
| `missionControlService` | Executive command center projection |
| `multiAgentRuntimeService` | Multi-agent coordination |
| `observabilityService` | Metrics + health snapshots |
| `orgHealthService` | Org-level health aggregation |
| `outcomeVerificationService` | Post-execution verification |
| `paymentService` | Payment CRUD |
| `productAnalyticsService` | Product usage analytics |
| `reviewService` | Review CRUD + sentiment |
| `rootCauseService` | Root cause analysis |
| `scenarioService` | Scenario modeling |
| `schedulerService` | Cron scheduler management |
| `secretVaultService` | Credential encryption/retrieval |
| `supportService` | Support ticket management |
| `toolFabricService` | Tool request routing + execution |
| `workflowGenerationService` | Recommendation → workflow step graph |
| `workspaceService` | Workspace registry |

### Provider Adapters (18 total)
| Adapter | Integration |
|---------|------------|
| `twilioSmsAdapter` | SMS (Twilio) |
| `gmailAdapter` | Email (Gmail) |
| `slackAdapter` | Messaging (Slack) |
| `microsoft365Adapter` | Email/Cal (M365) |
| `teamsAdapter` | Messaging (Teams) |
| `messagebirdAdapter` | SMS (MessageBird) |
| `outlookCalendarAdapter` | Calendar (Outlook) |
| `googleCalendarAdapter` | Calendar (Google) |
| `hubspotAdapter` | CRM (HubSpot) |
| `salesforceAdapter` | CRM (Salesforce) |
| `stripeAdapter` | Payments (Stripe) |
| `xeroAdapter` | Accounting (Xero) |
| `quickbooksAdapter` | Accounting (QuickBooks) |
| `mailchimpAdapter` | Email marketing (Mailchimp) |
| `activeCampaignAdapter` | CRM/marketing (ActiveCampaign) |
| `serviceTitanAdapter` | Field service (ServiceTitan) |
| `jobberAdapter` | Field service (Jobber) |
| `adapterRegistry` | Adapter registration + dispatch |

---

## Database — packages/db

### Migrations (30 total)
| # | Migration | Tables |
|---|-----------|--------|
| 0001 | Business intelligence | businesses, business_health, mri_questions, recommendations, constraints |
| 0002 | Seed MRI questions | mri_questions (data) |
| 0003 | Seed sample business | businesses (data) |
| 0004 | Constraint intelligence | business_constraints, constraint_scores |
| 0005 | Seed constraint library | constraint_definitions (data) |
| 0006 | Recommendation intelligence | business_recommendations, recommendation_scores |
| 0007 | Seed recommendation library | recommendation_definitions (data) |
| 0008 | Tool integration fabric | tool_definitions, tool_executions, integration_accounts |
| 0009 | Seed tool fabric | tool_definitions (data) |
| 0010 | Loop runtime | workflow_executions, task_executions |
| 0011 | AI employee memory | memory_records |
| 0012 | Tool execution telemetry | tool_execution_telemetry |
| 0013 | Provider evidence | provider_evidence, provider_health |
| 0014 | Scheduler | scheduler_jobs |
| 0015 | Decisions | business_decisions |
| 0016 | Scenarios | business_scenarios |
| 0017 | Event log | event_log |
| 0018 | Runtime durability | dead_letters, execution_events |
| 0019 | MVP journey metrics | mvp_journey_metrics |
| 0020 | Business diagnostic engine | business_diagnostics, diagnostic_areas |
| 0021 | Identity/organizations | organizations, organization_members, permission_policies |
| 0022 | Business discovery context | business_discovery, business_context_versions |
| 0023 | Business knowledge graph | business_graph_nodes, business_graph_edges, graph_versions |
| 0024 | KPI readings/goals/briefings | kpi_readings, business_goals, executive_briefings |
| 0025 | Customer OS | customers, customer_interactions, customer_health |
| 0026 | Jobs | jobs |
| 0027 | Appointments | appointments |
| 0028 | Invoices | invoices, invoice_line_items |
| 0029 | Payments | payments |
| 0030 | Customer reviews | customer_reviews |

### Repositories (Postgres — 40+)
appointmentRepository, businessCapabilityRepository, businessConstraintRepository, businessDecisionRepository, businessDiagnosticRepository, businessDiscoveryRepository, businessDnaRepository, businessGoalRepository, businessGraphRepository, businessHealthRepository, businessMriRepository, businessProfileRepository, businessRecommendationRepository, businessRepository, businessScenarioRepository, businessTimelineRepository, constraintPriorityRepository, constraintScoreRepository, customerRepository, deadLetterRepository, eventLogRepository, executionEventRepository, executiveBriefingRepository, integrationAccountRepository, invoiceRepository, jobRepository, kpiReadingRepository, memoryRecordRepository, organizationRepository, paymentRepository, permissionPolicyRepository, providerEvidenceRepository, providerHealthRepository, recommendationPriorityRepository, recommendationScoreRepository, reviewRepository, schedulerJobRepository, taskExecutionRepository, toolExecutionRepository, transformationRoadmapRepository, workflowExecutionRepository

### Repositories (In-Memory — for testing)
appointmentRepository, customerRepository, invoiceRepository, jobRepository, paymentRepository, reviewRepository + `inMemoryRepositories.ts` composite

---

## Runtime Packages

### @boss/loop — Canonical Automation Runtime
| Component | File | Purpose |
|-----------|------|---------|
| `BossRuntime` | `bossRuntime.ts` | Top-level runtime: lifecycle, tick, health |
| `WorkflowRuntime` | `workflowRuntime.ts` | Step-based workflow execution with compensation |
| `createLoopRuntime` | `runtime.ts` | Low-level step executor (sequential + parallel) |
| `AgentRuntime` | `agentRuntime.ts` | AI employee activation + inference dispatch |
| `InMemoryQueueRuntime` | `queueRuntime.ts` | In-process async task queue |
| `InMemorySchedulerRuntime` | `schedulerRuntime.ts` | Cron-like scheduler |
| `stateMachine` | `stateMachine.ts` | Execution state transitions |
| `createTaskHandlerRegistry` | `taskHandlerRegistry.ts` | Handler registration by TaskType |
| `resilience` | `resilience.ts` | Retry, circuit breaker, timeout patterns |
| `LoopRuntimePorts` | `ports.ts` | Repository port interfaces |
| `RuntimeTypes` | `runtimeTypes.ts` | Health, lifecycle, metrics types |

### @boss/mcp — Master Control Platform (Intelligence Only)
| Component | File | Purpose |
|-----------|------|---------|
| `aiEmployeeRuntime` | `aiEmployeeRuntime.ts` | Agent decision + inference |
| `businessDna` | `businessDna.ts` | DNA analysis |
| `businessHealth` | `businessHealth.ts` | Health scoring |
| `capabilityGraph` | `capabilityGraph.ts` | Capability relationship graph |
| `claudeInference` | `claudeInference.ts` | Claude API call abstraction |
| `constraintEngine` | `constraintEngine.ts` | Constraint analysis |
| `decisionEngine` | `decisionEngine.ts` | Decision generation |
| `decisionOptimization` | `decisionOptimization.ts` | Decision option scoring |
| `diagnosticEngine` | `diagnosticEngine.ts` | Root cause diagnostic |
| `executiveBrief` | `executiveBrief.ts` | Executive briefing generation |
| `kpiDerivation` | `kpiDerivation.ts` | KPI calculation from signals |
| `kpiHealthScore` | `kpiHealthScore.ts` | KPI → health score mapping |
| `kpiRecommendationEngine` | `kpiRecommendationEngine.ts` | KPI-driven recommendations |
| `multiAgentPlanner` | `multiAgentPlanner.ts` | Multi-agent task decomposition |
| `multiAgentReflection` | `multiAgentReflection.ts` | Agent self-evaluation |
| `planningEngine` | `planningEngine.ts` | Execution plan creation |
| `recommendationEngine` | `recommendationEngine.ts` | Recommendation generation |
| `rootCauseEngine` | `rootCauseEngine.ts` | Root cause identification |
| `scenarioEngine` | `scenarioEngine.ts` | Scenario modeling |
| `toolFabric` | `toolFabric.ts` | Tool selection intelligence |
| `verificationEngine` | `verificationEngine.ts` | Outcome verification |
| `workflowGenerator` | `workflowGenerator.ts` | Recommendation → workflow graph |

### @boss/events — Event Bus
| Component | Purpose |
|-----------|---------|
| `EventBus` interface | `publish()` + `subscribe()` |
| `InMemoryEventBus` | In-process implementation |
| `DurableEventBus` | Postgres-backed (event_log table) |

### @boss/registries — 50+ Canonical Registries
agent, aiEmployee, approval, automation, automationCenter, businessQuery, businessRelationship, businessRule, capability, capabilityContract, capabilityPack, constraint, constraintCategory, constraintDefinition, dashboard, decision, dna, event, feature, forecast, goalOption, governance, health, insight, intelligenceCenter, kpi, learning, lifecycle, marketplace, metric, mri, operatingLoop, optimization, orchestrator, painPoint, planning, playbook, policy, prompt, providerDefinition, recommendationCategory, recommendationDefinition, runtime, semanticView, timeline, toolDefinition, trigger, verification, workflow, workspace

### @boss/capabilities — Capability Pack Platform
- `manifest.ts` — Pack manifest validation
- `runtime.ts` — Pack install/activate/deactivate lifecycle

### @boss/types — Shared Type Definitions
businessContext, businessGraph, businessQuery, businessSemantic, capabilityPack, diagnostic, identity, ontology, primitives

---

## Intelligence Layer — packages/mcp (Law 1: MCP owns all intelligence)

**Never executes workflows. Never authenticates. Never renders UI.**

Provides:
- KPI derivation from raw signals
- Root cause analysis
- Recommendation generation
- Decision synthesis
- Constraint detection
- Executive briefing creation
- Workflow graph generation (step definitions only)
- AI employee decision logic
- Multi-agent planning
- Scenario modeling
- Outcome verification

---

## Industry Packs (11 verticals)

Each pack provides: `kpis`, `workflows`, `constraints`, `decisions`, `mri`, `playbooks`, `integrations`, `aiEmployees` (selected packs), `workspace`

| Pack | Status |
|------|--------|
| `general-smb` | Active |
| `home-services` | Active |
| `home-care` | Active |
| `restaurant` | Active |
| `retail` | Active |
| `legal` | Active |
| `landscaping` | Active |
| `cleaning` | Active |
| `dental` | Active |
| `accounting` | Active |
| `coffee-shop` | Active |

---

## Tests (536 passing)

Coverage spans: AI employee runtime, analytics, appointments, business context/graph/diagnostic/lifecycle/query/semantic, constraint analysis, decision flow, domain events, executive intelligence, identity, invoice, job, loop runtime, mission control, multi-agent, MVP journey, observability, organization, payment, provider adapters, recommendations, reviews, runtime persistence, scenarios, scheduler, secret vault, tool fabric, workflow generation + all RC series (RC1–RC15) integration suites.

---

## Current Branch
`rc2/project-renaissance` — Design system RC2, Google auth, env examples
