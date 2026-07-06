# AUTOMATION RUNTIME ARCHITECTURE
> Generated: 2026-07-05 | One Runtime. Every automation executes through it.

---

## The Canonical Automation Runtime

```
┌─────────────────────────────────────────────────────────────────────┐
│                      BOSS AUTOMATION RUNTIME                        │
│                    (packages/loop — BossRuntime)                    │
└─────────────────────────────────────────────────────────────────────┘

Business Event / Schedule / Manual Trigger
              │
              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TRIGGER ENGINE                                                     │
│  ├── EventBus subscriber (@boss/events)                             │
│  ├── InMemorySchedulerRuntime (packages/loop/schedulerRuntime.ts)   │
│  └── Manual HTTP trigger (apps/api/src/controllers/*)              │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ workflow_key + input
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WORKFLOW ENGINE                                                     │
│  ├── WorkflowRuntime (packages/loop/workflowRuntime.ts)             │
│  │   └── Looks up ExecutableWorkflowDefinition from workflowRegistry│
│  └── createLoopRuntime (packages/loop/runtime.ts)                   │
│      └── Executes StepEntry[] (sequential + parallel)               │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ step type + input
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DECISION ENGINE  (MCP — read-only intelligence)                    │
│  ├── decisionEngine (packages/mcp/intelligence/decisionEngine.ts)   │
│  ├── constraintEngine (packages/mcp/intelligence/constraintEngine.ts│
│  ├── planningEngine (packages/mcp/intelligence/planningEngine.ts)   │
│  └── Called by BTE operating loop — never by Loop directly          │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ decision output
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POLICY ENGINE                                                      │
│  ├── policyRegistry (@boss/registries/registries/policy.ts)         │
│  ├── approvalRegistry (@boss/registries/registries/approval.ts)     │
│  └── executionPlanService (safe-auto-execute threshold check)       │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ approved actions
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AGENT DISPATCHER                                                   │
│  ├── AgentRuntime (packages/loop/agentRuntime.ts)                   │
│  ├── aiWorkforceService (apps/api/src/services/aiWorkforceService)  │
│  └── MCP: aiEmployeeRuntime + multiAgentPlanner                     │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ task type + resolved handler
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTION ENGINE                                                   │
│  ├── TaskHandlerRegistry (packages/loop/taskHandlerRegistry.ts)     │
│  ├── "tool" handler → toolFabricService                             │
│  ├── "ai" handler → aiWorkforceService + MCP inference              │
│  ├── "notification" handler → notificationService [H-1 CREATE]      │
│  └── "approval" handler → approval gate + WorkflowRuntime.approve() │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ step results
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  OS MODULES  (domain execution)                                     │
│  ├── Customer OS: customerService, customerHealthService            │
│  ├── Work OS: jobService, appointmentService                        │
│  ├── Money OS: invoiceService, paymentService                       │
│  ├── Communication OS: notificationService → adapters               │
│  ├── Growth OS: leadService [H-8 CREATE], referralService           │
│  ├── Decision OS: businessDecisionService, scenarioService          │
│  └── Intelligence OS: kpiMeasurementService, analyticsService       │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ outcomes
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  NOTIFICATION LAYER                                                 │
│  ├── notificationService (canonical dispatch) [H-1 CREATE]          │
│  ├── adapterRegistry → Twilio, Gmail, Slack, Teams, MessageBird     │
│  └── notification_deliveries table (delivery log)                   │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ event emissions
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AUDIT LAYER                                                        │
│  ├── eventLogRepository (packages/db/postgres/eventLogRepository)   │
│  ├── executionEventRepository (execution-scoped events)             │
│  ├── DurableEventBus (@boss/events/durableEventBus.ts)              │
│  └── deadLetterRepository (failed step quarantine)                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ metrics
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  TELEMETRY                                                          │
│  ├── RuntimeTelemetry (packages/loop/telemetry.ts)                  │
│  ├── observabilityService (apps/api/src/services/observability)     │
│  ├── http/telemetry.ts (OpenTelemetry middleware)                   │
│  └── productAnalyticsService (PostHog usage tracking)               │
└─────────────────────────┬───────────────────────────────────────────┘
                          │ outcomes → MCP
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LEARNING LAYER                                                     │
│  ├── memoryRecordRepository (AI employee memory)                    │
│  ├── MCP: multiAgentReflection (agent self-evaluation)              │
│  ├── MCP: verificationEngine (outcome verification)                 │
│  └── outcomeVerificationService (BTE verify phase)                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Runtime Execution Contract

Every automation **must** be expressed as a `WorkflowDefinitionEntry` registered in `workflowRegistry`. It **must not** be custom code in a service.

```typescript
// All automations follow this contract:
interface WorkflowDefinitionEntry {
  id: string;                        // e.g. "auto_missed_call_lead_capture"
  key: string;                       // e.g. "communication.missed_call"
  triggerType: "event" | "schedule" | "manual";
  steps: ExecutableWorkflowStep[];   // Resolved at runtime by handler registry
  // ...metadata
}

// Steps are one of three types:
type StepType =
  | "tool"         // → toolFabricService (capability execution)
  | "ai"           // → AgentRuntime + MCP inference
  | "notification" // → notificationService (NEW — H-1)
```

---

## BossRuntime Lifecycle

```typescript
// Server startup:
const runtime = new BossRuntime(workflows, agents, queue, scheduler, telemetry);
runtime.start(activeAgentIds);

// Platform tick (every N seconds):
await runtime.tick(new Date());
// tick() = scheduler.runDue() + queue.runUntilIdle(handlers)

// Shutdown:
runtime.shutdown();
```

---

## Event-Driven Trigger Pattern

```typescript
// Any service emitting a domain event triggers subscribed automations:
eventBus.subscribe("customer.created", async (event) => {
  await workflowRuntime.execute(
    onboardingWorkflowDefinition,
    event.payload.businessId,
    event.payload,
    { orgId: event.payload.orgId, businessId: event.payload.businessId }
  );
});
```

---

## Scheduled Trigger Pattern

```typescript
// BTE and reminder workflows register cron rules:
scheduler.schedule({
  id: `bte.${businessId}`,
  cronExpression: "0 6 * * *",
  handler: () => queue.enqueue("bte.daily_cycle", { orgId, businessId })
});
```

---

## Approval Gate Pattern

```typescript
// High-risk steps pause execution and await approval:
const approvalStep: ExecutableWorkflowStep = {
  id: "approve_large_invoice",
  kind: "approval",
  async execute(ctx) { /* send approval request */ },
  async approve(ctx) { return await approvalGateService.check(ctx.executionId); }
};
```

---

## Compensation Pattern

```typescript
// Every step with side effects should declare a compensate():
const createJobStep: ExecutableWorkflowStep = {
  id: "create_job",
  kind: "action",
  async execute(ctx) { return await jobService.create(ctx.input); },
  async compensate(ctx) { await jobService.delete(ctx.outputs.create_job.jobId); }
};
// WorkflowRuntime calls compensate() in reverse order on failure
```

---

## What NEVER bypasses the Runtime

- ❌ Direct service-to-service calls for automation logic
- ❌ Cron jobs that call services directly (must enqueue to queue)
- ❌ API controllers orchestrating multi-step workflows
- ❌ MCP engines executing side effects
- ✅ Everything goes through BossRuntime → WorkflowRuntime/createLoopRuntime → TaskHandlerRegistry
