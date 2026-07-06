# HARMONIZATION PLAN
> Generated: 2026-07-05 | Converge every duplicate into one canonical implementation

---

## H-1: Notification Layer — Create Canonical `notificationService`

**Problem**: 12 of 18 automations call provider adapters directly. There is no unified notification dispatch. SMS goes to `twilioSmsAdapter`, email goes to `gmailAdapter`, Slack goes to `slackAdapter` — all bypassing a canonical layer.

**Canonical Solution**: Create `packages/notifications` (or `apps/api/src/services/notificationService.ts`) that:
1. Accepts a `NotificationRequest` with `channel: "sms" | "email" | "slack" | "teams" | "push"`
2. Routes to the correct provider adapter via `adapterRegistry`
3. Emits `notification.sent` event via EventBus
4. Persists delivery record to `notification_deliveries` table
5. Handles retries via Loop resilience

**Canonical Provider Priorities**:
- SMS: Twilio primary, MessageBird fallback
- Email: Gmail primary, M365 fallback
- Chat: Slack primary, Teams fallback

**Files to Create**:
- `apps/api/src/services/notificationService.ts` — canonical notification dispatch
- `packages/db/migrations/0031_notification_deliveries.sql` — delivery log table

**Files to Deprecate**: Direct adapter calls in all workflow steps — all must route through `notificationService`

**Impact**: Unblocks AUTO-001, AUTO-002, AUTO-003, AUTO-004, AUTO-005, AUTO-006, AUTO-007, AUTO-013, AUTO-014, AUTO-016, AUTO-017, AUTO-018

---

## H-2: WorkflowRuntime vs createLoopRuntime — Clarify Boundary

**Problem**: Two workflow execution mechanisms exist in `@boss/loop`:
1. `WorkflowRuntime` (`workflowRuntime.ts`) — step-based, uses `ExecutableWorkflowDefinition`, integrates with `workflowRegistry`, has `ExecutionContextGuard`
2. `createLoopRuntime` (`runtime.ts`) — step-based, uses `StepEntry[]`, has `TaskHandlerRegistry`, parallel step groups, compensation

**Analysis**: These are NOT pure duplicates — they serve different abstraction levels:
- `WorkflowRuntime`: Higher-level, registry-aware, context-guarded, used by `packages/loop` consumers
- `createLoopRuntime`: Lower-level, handler-registry-based, used by `loopRuntimeService` in API

**Canonical Resolution**: Keep both but formalize the relationship:
- `WorkflowRuntime` = orchestration layer (selects workflow definition from registry, manages context)
- `createLoopRuntime` = execution engine (`WorkflowRuntime` delegates to it)
- `loopRuntimeService` uses `createLoopRuntime` directly (fine — it's the wire-up layer)
- All new automations use `WorkflowRuntime` (higher-level API)

**Action**: Add a comment to both files documenting the relationship. No code deletion needed.

---

## H-3: Root Cause vs Diagnostic Engine — Formalize Separation

**Problem**: Both `rootCauseService` / MCP `rootCauseEngine` and `businessDiagnosticService` / MCP `diagnosticEngine` perform causal analysis.

**Analysis**: These serve different use cases:
- `diagnosticEngine`: Structured MRI-style diagnostic session — user-initiated, produces a diagnostic report across areas (marketing, operations, finance, etc.). Persisted as a `business_diagnostic` record.
- `rootCauseEngine`: Automated causal chain analysis — BTE-initiated, produces a `root_cause` artifact for decision making. Part of the operating loop.

**Canonical Resolution**: Keep both, formalize ownership:
- `diagnosticEngine` → owned by Business context (manual trigger, workspace UI)
- `rootCauseEngine` → owned by BTE / operating loop (automated trigger, no UI)

**Action**: Add `@owner` annotations to both service files. No code changes needed.

---

## H-4: SMS Adapters — Establish Primary/Fallback Pattern

**Problem**: `twilioSmsAdapter` and `messagebirdAdapter` both send SMS with no coordination.

**Canonical Resolution**:
- Primary: `twilioSmsAdapter`
- Fallback: `messagebirdAdapter` (activated by circuit breaker when Twilio fails)

**Action**: `adapterRegistry` already has circuit breaker support. Wire `messagebirdAdapter` as fallback for `sms` channel in the registry configuration. This is a configuration change, not a code deletion.

---

## H-5: Secret Vault — Production Upgrade

**Problem**: `encryptedInMemorySecretStore` is test-only. Production needs a database-backed vault.

**Canonical Resolution**: Create `dbSecretStore` that stores AES-256 encrypted credentials in `provider_credentials` table (new migration). Both stores implement `SecretStore` interface — swap via config.

**Files to Create**:
- `apps/api/src/services/secretVault/dbSecretStore.ts`
- `packages/db/migrations/0032_provider_credentials.sql`

**Files to Keep**: `envSecretStore` (for Doppler-backed deployments), `encryptedInMemorySecretStore` (tests only)

---

## H-6: Feature Flags — Dynamic Flag Service

**Problem**: `featureFlagService` is env-var based only. Runtime flag changes require redeploy.

**Canonical Resolution**: Extend `featureFlagService` to support:
1. Env vars (current — keep for infra flags)
2. Database-backed flags (for business-level feature rollout)

**Files to Create**:
- `packages/db/migrations/0033_feature_flags.sql` — `feature_flags` table
- Extend `apps/api/src/services/featureFlagService.ts` to read DB first, fall back to env

---

## H-7: Event Emission Gaps — Canonical Event Emission Points

**Problem**: Many services do not emit domain events, breaking the event-driven automation chain.

**Missing Event Emissions** (8 locations):
| Service | Missing Event | Action |
|---------|--------------|--------|
| `customerService.create()` | `customer.created` | Add EventBus.publish call |
| `jobService.complete()` | `job.completed` | Add EventBus.publish call |
| `paymentService.create()` | `payment.received` | Add EventBus.publish call |
| `invoiceService.markPaid()` | `invoice.paid` | Add EventBus.publish call |
| `appointmentService.create()` | `appointment.created` | Add EventBus.publish call |
| `reviewService.create()` | `review.received` | Add EventBus.publish call |
| `kpiMeasurementService.measure()` | `kpi.threshold.exceeded` (conditional) | Add threshold check + publish |
| Telephony inbound | `communication.missed_call.detected` | New webhook route |

**Pattern** (Law 1: log to audit trail before side effects):
```typescript
// 1. Persist record
const record = await repos.customers.create(input);
// 2. Emit canonical event
await eventBus.publish({ type: "customer.created", payload: { orgId, businessId, customerId: record.id }, occurredAt: nowIso() });
// 3. Return
return record;
```

---

## H-8: Lead Entity — Net New

**Problem**: No lead management entity. Growth OS automations (AUTO-001, AUTO-015) are blocked.

**Canonical Solution**:
- `packages/db/migrations/0034_leads.sql` — `leads` table
- `packages/db/src/repositories/postgres/leadRepository.ts`
- `apps/api/src/services/leadService.ts`
- `apps/api/src/controllers/leadController.ts`
- Events: `lead.created`, `lead.qualified`, `lead.assigned`, `lead.converted`

---

## Harmonization Priority Order

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | H-1: notificationService | Medium | Unblocks 12 automations |
| P0 | H-7: Event emissions | Low | Unblocks 8 automations |
| P1 | H-8: Lead entity | Medium | Unblocks 2 automations |
| P1 | H-4: SMS primary/fallback | Low | Fixes dual SMS |
| P2 | H-5: DB secret store | Medium | Production readiness |
| P2 | H-6: Dynamic feature flags | Medium | Rollout control |
| P3 | H-2: Workflow/Loop boundary docs | Low | Developer clarity |
| P3 | H-3: Diagnostic/RCA separation docs | Low | Developer clarity |
