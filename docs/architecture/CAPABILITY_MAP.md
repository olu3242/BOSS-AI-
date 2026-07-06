# CAPABILITY MAP
> Generated: 2026-07-05 | Single canonical capability map for every platform feature

---

## Legend
- **Status**: `active` | `partial` | `stub` | `missing`
- **Duplicates**: Conflicting implementations of the same capability
- **Canonical**: The one implementation to use — all others deprecated

---

## 1. Identity & Auth

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Email/password auth | Supabase Auth | Sign-in/sign-up | Supabase | Web BFF | active | — |
| Google OAuth PKCE | Supabase Auth + `GoogleSignInButton` | Social sign-in | Supabase, `supabaseBrowser.ts` | Web auth pages | active | — |
| Session cookies | `/api/auth/session` BFF route | httpOnly session from tokens | Supabase | All protected routes | active | — |
| JWT validation | `apps/api/src/http/auth.ts` | API auth middleware | Supabase JWT | All API controllers | active | — |
| Organization management | `identity.ts` + org routes | Multi-org support | `organizations` table | Dashboard, workspace | active | — |
| Permission policies | `permissionPolicyRepository` | RBAC | `permission_policies` table | All services | active | — |
| Middleware guard | `apps/web/middleware.ts` | Protect web routes | Session cookie | All `/dashboard`, `/business/*` | active | — |

---

## 2. Business Context

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Business CRUD | `businessProfileService` + controller | Business entity management | `businesses` table | All OS modules | active | — |
| Business context versioning | `businessContextService` | Publish canonical context | `business_context_versions` | MCP, Loop, BTE | active | — |
| Business DNA | `businessDnaService` + MCP `businessDna` | DNA profile + analysis | `business_dna` table | BTE, recommendations | active | — |
| Business health score | `businessHealthService` + MCP `businessHealth` | Health calculation | KPIs, constraints | Dashboard, health page | active | — |
| MRI survey | `businessMriService` | Readiness assessment | `business_mri`, `mri_questions` | Health page | active | — |
| Knowledge graph | `businessGraphService` + `businessGraphRuntime` | Business relationship graph | `business_graph_nodes/edges` | Semantic layer, BTE | active | — |
| Semantic layer | `businessSemanticLayer` | Semantic context projection | Graph | Query layer, intelligence | active | — |
| Business query (BQIL) | `businessQueryService` | Canonical business queries | Semantic layer | Analytics, intelligence | active | — |
| Timeline | `businessTimelineService` | Event history | `business_timeline` | Timeline page | active | — |
| Discovery | `businessDiscoveryRepository` | Discovery aggregate | `business_discovery` | Context publish flow | active | — |

---

## 3. Business Transformation Engine (BTE)

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| BTE coordinator | `bteService` | 7-phase daily cycle | `businessOperatingLoopService`, scheduler | Platform cron | active | — |
| Operating loop | `businessOperatingLoopService` | Observe→Analyze→Decide→Plan→Execute→Verify→Learn | MCP (all intelligence) | BTE | active | — |
| Scheduler | `schedulerService` + `InMemorySchedulerRuntime` | Cron management | `scheduler_jobs` table | BTE, Loop | active | — |
| Execution plan | `executionPlanService` | Safe-auto-execute gate | Decisions, Loop | BTE execute phase | active | — |
| Outcome verification | `outcomeVerificationService` | Post-cycle verification | MCP `verificationEngine` | BTE verify phase | active | — |

---

## 4. Intelligence (MCP — owns all intelligence)

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| KPI derivation | MCP `kpiDerivation` | Calculate KPIs from signals | Health, events, workflows | KPI service, BTE | active | — |
| KPI health scoring | MCP `kpiHealthScore` | Score → health mapping | KPI readings | Health service | active | — |
| KPI recommendations | MCP `kpiRecommendationEngine` | KPI-driven recs | KPI readings | Recommendation service | active | — |
| Root cause analysis | MCP `rootCauseEngine` + `rootCauseService` | Identify root causes | Constraints, health | BTE analyze phase | active | **PARTIAL DUPLICATE**: `businessDiagnosticService` also does root cause — canonical is MCP `rootCauseEngine` |
| Recommendation engine | MCP `recommendationEngine` + `businessRecommendationService` | Generate recs | DNA, health, constraints | BTE, workspace | active | — |
| Decision engine | MCP `decisionEngine` + `businessDecisionService` | Decision synthesis | Recs, constraints, health | BTE, workspace | active | — |
| Decision optimization | MCP `decisionOptimization` | Score options | Decisions | Decision engine | active | — |
| Constraint engine | MCP `constraintEngine` + `businessConstraintService` | Detect constraints | Health, business data | BTE, workspace | active | — |
| Diagnostic engine | MCP `diagnosticEngine` + `businessDiagnosticService` | Deep diagnostic | Constraints, health | Health page | active | **PARTIAL OVERLAP**: root cause also in `rootCauseService` — separate concerns (diagnostic = structured session; root cause = causal chain) |
| Executive briefing | MCP `executiveBrief` + `executiveBriefingService` | Generate briefs | All signals | Mission control | active | — |
| Scenario engine | MCP `scenarioEngine` + `scenarioService` | What-if modeling | Business context | Scenarios workspace | active | — |
| Planning engine | MCP `planningEngine` + `executionPlanService` | Create execution plan | Decisions | BTE plan phase | active | — |
| Insight service | `insightService` | Business insights | MCP, business data | Intelligence workspace | active | — |
| Workflow generator | MCP `workflowGenerator` + `workflowGenerationService` | Rec → workflow steps | Recommendations | Approval → Loop | active | — |
| Claude inference | MCP `claudeInference` | LLM calls (claude-sonnet-4-6) | Anthropic API | All MCP engines | active | — |
| Multi-agent planner | MCP `multiAgentPlanner` + `multiAgentRuntimeService` | Agent task decomposition | Agent registry | AI Workforce | active | — |
| Multi-agent reflection | MCP `multiAgentReflection` | Agent self-evaluation | Agent outputs | Multi-agent loop | active | — |
| Verification engine | MCP `verificationEngine` + `outcomeVerificationService` | Outcome verification | Pre/post snapshots | BTE verify phase | active | — |
| Capability graph | MCP `capabilityGraph` | Capability relationships | Capability registry | Tool fabric | active | — |
| Tool fabric intelligence | MCP `toolFabric` + `toolFabricService` | Tool routing intelligence | Capability graph | Execution engine | active | — |
| Response map | MCP `responseMap` | Structured LLM response parsing | Claude inference | All MCP engines | active | — |

---

## 5. Automation Runtime (Loop — owns all execution)

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| BossRuntime | `packages/loop/src/bossRuntime.ts` | Top-level runtime lifecycle | All runtime sub-components | API server startup | active | — |
| WorkflowRuntime | `packages/loop/src/workflowRuntime.ts` | Step-based execution + compensation | WorkflowStore, EventBus | Loop runtime service | active | **POTENTIAL DUPLICATE**: `createLoopRuntime` in `runtime.ts` also executes steps — see Harmonization |
| createLoopRuntime | `packages/loop/src/runtime.ts` | Low-level sequential/parallel step executor | TaskHandlerRegistry, EventBus, ports | `loopRuntimeService` | active | **POTENTIAL DUPLICATE**: overlaps with WorkflowRuntime |
| AgentRuntime | `packages/loop/src/agentRuntime.ts` | AI employee execution | AgentRegistry, LLM | `aiWorkforceService` | active | — |
| InMemoryQueueRuntime | `packages/loop/src/queueRuntime.ts` | Async task queue | — | BossRuntime.tick() | active | — |
| InMemorySchedulerRuntime | `packages/loop/src/schedulerRuntime.ts` | Cron scheduler | — | BossRuntime.tick() | active | — |
| TaskHandlerRegistry | `packages/loop/src/taskHandlerRegistry.ts` | Task type → handler mapping | — | createLoopRuntime | active | — |
| StateMachine | `packages/loop/src/stateMachine.ts` | Execution state transitions | — | WorkflowRuntime, createLoopRuntime | active | — |
| Resilience | `packages/loop/src/resilience.ts` | Retry, circuit breaker, timeout | — | All runtime components | active | — |

---

## 6. Work OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Jobs | `jobService` + `jobController` + `JobsClient` | Job CRUD + lifecycle | `jobs` table | Work workspace | active | — |
| Appointments | `appointmentService` + controller + `AppointmentsClient` | Scheduling | `appointments` table | Work workspace | active | — |
| Job scheduling (field) | ServiceTitan/Jobber adapters | External field scheduling | Provider adapters | Work OS automations | active | — |

---

## 7. Money OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Invoices | `invoiceService` + controller + `InvoicesClient` | Invoice CRUD + status | `invoices`, `invoice_line_items` | Money workspace | active | — |
| Payments | `paymentService` + controller + `PaymentsClient` | Payment CRUD | `payments` table | Money workspace | active | — |
| Stripe integration | `stripeAdapter` | Payment processing | Stripe API | Payments | active | — |
| QuickBooks integration | `quickbooksAdapter` | Accounting sync | QB API | Invoices, payments | active | — |
| Xero integration | `xeroAdapter` | Accounting sync | Xero API | Invoices, payments | active | — |

---

## 8. Customer OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Customers | `customerService` + controller + `page.tsx` | Customer CRUD + interactions | `customers` table | Customer workspace | active | — |
| Customer health | `customerHealthService` | Customer health scoring | `customer_health` table | CS dashboard | active | — |
| Reviews | `reviewService` + controller + `ReviewsClient` | Review management | `customer_reviews` | Reviews workspace | active | — |
| CRM integration | HubSpot/Salesforce/ActiveCampaign adapters | CRM sync | Provider adapters | Customer OS | active | — |

---

## 9. Communication OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| SMS | `twilioSmsAdapter`, `messagebirdAdapter` | Outbound SMS | Twilio/MessageBird APIs | Automation, notifications | active | **DUPLICATE**: two SMS adapters — canonical is `twilioSmsAdapter`; MessageBird is fallback |
| Email | `gmailAdapter`, `microsoft365Adapter` | Outbound email | Gmail/M365 APIs | Automation, notifications | active | **DUPLICATE**: two email adapters — both valid (different provider) |
| Messaging | `slackAdapter`, `teamsAdapter` | Team messaging | Slack/Teams APIs | Internal notifications | active | Both valid (different provider) |
| Notification service | **MISSING** | Unified notification dispatch | All comm adapters | All automations | **missing** | No canonical `notificationService` — all comms go direct to adapters |

---

## 10. Growth OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Lead management | **MISSING** | Lead capture + qualification | — | Growth automations | **missing** | No `leadService` or `lead` table |
| Email marketing | `mailchimpAdapter`, `activeCampaignAdapter` | Campaign management | APIs | Growth automations | active | Both valid (different provider) |
| Referral workflows | Registry definitions only | Referral program logic | — | Money OS workflows | **stub** | No `referralService` |

---

## 11. Decision OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Decisions | `businessDecisionService` + `DecisionsClient` | Decision record management | MCP decision engine | Decision workspace | active | — |
| Scenarios | `scenarioService` + `ScenariosClient` | What-if modeling | MCP scenario engine | Scenarios workspace | active | — |
| Approvals | `ApprovalActions` + `/workspace/approvals` | Approval gate management | Loop, recommendations | Workflow approval flow | active | — |
| Policy engine | `policy` registry + `governance` registry | Business rule policies | Registries | Decision engine | active | Policies defined in registry only — no runtime enforcement service |

---

## 12. Intelligence OS

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Analytics | `analyticsService` + `AnalyticsClient` | Analytics aggregation | Business data | Analytics workspace | active | — |
| Product analytics | `productAnalyticsService` | Usage analytics (PostHog) | PostHog | Internal ops | active | — |
| KPI measurement | `kpiMeasurementService` | KPI derivation + persistence | MCP, `kpi_readings` | BTE, dashboard | active | — |
| Executive briefings | `executiveBriefingService` + mission control | Brief generation | MCP | Mission control page | active | — |
| Insights | `insightService` | Generated insights | MCP, business data | Intelligence workspace | active | — |
| Dashboard | `DashboardClient` | Multi-business overview | API | Dashboard page | active | — |
| Mission Control | `missionControlService` + `missionControlController` | Executive command center | BTE, KPIs, briefings | Mission control page | active | — |

---

## 13. Marketplace & Capability Packs

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Marketplace browser | `marketplaceService` + `MarketplaceClient` | Template/pack discovery | Marketplace registry | Marketplace page | active | — |
| Capability pack install | `businessCapabilityService` + `@boss/capabilities` | Pack lifecycle | Capability registry, db | Marketplace | active | — |
| Industry packs (11) | `industry-packs/*` | Vertical business knowledge | All registries | Business setup, MCP | active | — |

---

## 14. Platform Infrastructure

| Feature | Owner | Purpose | Dependencies | Consumers | Status | Duplicates |
|---------|-------|---------|-------------|-----------|--------|-----------|
| Event bus | `@boss/events` | Domain event pub/sub | In-memory or durable | All services, Loop | active | — |
| Secret vault | `secretVaultService` | Credential encryption | `encryptedInMemorySecretStore` / `envSecretStore` | Provider adapters | active | **PARTIAL**: in-memory store only — no database-backed vault for prod |
| Feature flags | `featureFlagService` | Flag evaluation | Env vars | API + web | active | **PARTIAL**: env-var based only — no dynamic flag service |
| Observability | `observabilityService` + `http/telemetry.ts` | Metrics + health | OpenTelemetry | All services | active | — |
| Container / DI | `apps/api/src/container.ts` | Dependency injection | All repositories | All services | active | — |
| Security | `apps/api/src/security.ts` | API security middleware | — | HTTP server | active | — |
| Runtime persistence | `runtimePersistence.ts` | Runtime state persistence | DB repos | BossRuntime | active | — |

---

## Identified Duplicates Requiring Harmonization

| Duplicate Set | Canonical Choice | Reason |
|--------------|-----------------|--------|
| `WorkflowRuntime` vs `createLoopRuntime` | Converge: `WorkflowRuntime` wraps `createLoopRuntime` steps | WorkflowRuntime adds compensation + event contracts on top |
| Root cause: `rootCauseEngine` vs `diagnosticEngine` | Keep separate: `diagnosticEngine` = structured session; `rootCauseEngine` = causal chain output | Different abstractions, not duplicates |
| SMS: Twilio vs MessageBird | Canonical: Twilio (`twilioSmsAdapter`); MessageBird as fallback provider | Primary/fallback pattern via `adapterRegistry` |
| Notification: direct adapter calls | Missing canonical `notificationService` — must be created | All automations need unified dispatch |
| Lead management | Missing — needs `leadService` + `leads` table migration | Required for Growth OS automations |
| Policy enforcement | Policy registry exists but no runtime enforcement service | Policies are defined but not evaluated at runtime |

---

## Dead / Stub Implementations
| Item | Location | Status | Recommendation |
|------|----------|--------|---------------|
| `betaInviteService` | `apps/api/src/services/betaInviteService.ts` | Active for beta — deprecate post-launch | Archive after GA |
| `supportService` | `apps/api/src/services/supportService.ts` | Stub — no frontend | Keep, wire to Communication OS |
| Workspace `/money`, `/work`, `/operations`, `/intelligence` pages | `apps/web/app/business/[businessId]/workspace/` | Stub pages | Wire to services |
| `encryptedInMemorySecretStore` | `secretVault/` | Test only | Replace with DB-backed vault in prod |
