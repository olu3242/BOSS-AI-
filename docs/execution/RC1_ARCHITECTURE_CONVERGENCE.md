# RC1 Architecture Convergence

**Date:** 2026-06-30

---

## Architecture Status: FROZEN AND STABLE

No new abstractions were introduced in RC1. All changes extended existing components.

---

## Component Convergence Map

| Component | Owns | Status |
|---|---|---|
| `packages/mcp` | Intelligence (DNA, health, decisions, scenarios, briefs) | ✓ Stable |
| `packages/loop` | Execution (workflow steps, parallel groups) | ✓ Stable |
| `packages/db` | Persistence (28 repos, 17 migrations) | ✓ Stable |
| `packages/events` | EventBus + DurableEventBus | ✓ Extended RC1 |
| `packages/registries` | Provider/tool/policy/AI employee registries | ✓ Stable |
| `packages/types` | All domain types | ✓ Stable |
| `apps/api` | HTTP surface, services coordination | ✓ Extended RC1 |

---

## Two Laws Verification

**Law 1 — MCP owns intelligence, Loop owns execution:**

| Intelligence (in MCP) | Execution (in Loop/API) |
|---|---|
| Decision generation | Loop runtime execution |
| Scenario calculation | Scheduler runDue |
| Executive briefs | Tool fabric dispatch |
| Optimization signals | Workflow step coordination |
| Multi-agent planning | Agent tool execution |

Zero business logic crossed into Loop Runtime in RC1.

**Law 2 — Everything measurable:**
- 7 domain-event-driven counters in ObservabilityService
- P50/P95 latency ring buffer
- ProviderHealth records per adapter execution
- ToolAuditRecord per tool invocation
- EventLog with correlation IDs for distributed tracing

---

## RC1 Extensions (Zero New Abstractions)

| Change | Extended | Not Replaced |
|---|---|---|
| DurableEventBus | EventBus interface | In-memory bus still works |
| EventLogRepository | Existing repository pattern | New table, same contract |
| google_calendar adapter | ProviderAdapter interface | Same pattern as Gmail |
| quickbooks adapter | ProviderAdapter interface | Same pattern as Twilio |
| computeNextCronRun | SchedulerService.runDue | Same runDue() method |
| recoverFailed() | SchedulerService interface | Additive |
| requireRole() | requireOrgId() pattern | Auth.ts extended |
| listVersions() | SecretStore interface | Additive |
| Secret versioning | EncryptedInMemorySecretStore | No new store class |

---

## Boundary Violations: ZERO

Checked against architecture rules:
- No business logic in Loop Runtime
- No execution logic in MCP
- No hardcoded industry-specific logic
- No duplicate data across bounded contexts
- No competing implementations introduced
