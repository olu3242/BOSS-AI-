# MVP GAP ANALYSIS
> Generated: 2026-07-05 | Only blockers preventing production MVP

---

## Platform Reuse Score

| Category | Reuse % | New Build % |
|----------|---------|------------|
| Authentication & Identity | 100% | 0% |
| Business Context & Intelligence | 100% | 0% |
| Work OS (Jobs, Appointments) | 95% | 5% |
| Money OS (Invoices, Payments) | 90% | 10% |
| Customer OS | 85% | 15% |
| Decision OS | 100% | 0% |
| Intelligence OS + BTE | 100% | 0% |
| Automation Runtime | 100% | 0% |
| Communication OS | 30% | 70% |
| Growth OS | 10% | 90% |
| **Overall** | **~78%** | **~22%** |

---

## Critical Gaps (MVP Blockers)

### GAP-01 — Canonical Notification Service
**Category**: Critical
**Blocker for**: 12 of 18 automations
**Effort**: ~2 days
**Reuse %**: 95% (all adapters + EventBus already exist)
**New code**: `notificationService.ts` + `0031_notification_deliveries.sql`

Missing:
- `apps/api/src/services/notificationService.ts`
- `packages/db/migrations/0031_notification_deliveries.sql`
- `apps/api/src/controllers/notificationController.ts` (optional — internal only)
- Task handler registration: `handlers.register("notification.send_sms", ...)` in `loopRuntimeService`

---

### GAP-02 — Missing Domain Event Emissions (8 services)
**Category**: Critical
**Blocker for**: 8 automations
**Effort**: 1 day (8 one-line additions)
**Reuse %**: 100% (EventBus already exists and is wired)
**New code**: 0 new files — add `eventBus.publish()` calls to existing services

| Service | Line to Add |
|---------|------------|
| `customerService.create()` | `await eventBus.publish({ type: "customer.created", ... })` |
| `jobService.complete()` | `await eventBus.publish({ type: "job.completed", ... })` |
| `paymentService.create()` | `await eventBus.publish({ type: "payment.received", ... })` |
| `invoiceService.markPaid()` | `await eventBus.publish({ type: "invoice.paid", ... })` |
| `appointmentService.create()` | `await eventBus.publish({ type: "appointment.created", ... })` |
| `reviewService.create()` | `await eventBus.publish({ type: "review.received", ... })` |
| `kpiMeasurementService.measure()` | `if threshold exceeded: await eventBus.publish({ type: "kpi.threshold.exceeded", ... })` |
| Inbound telephony webhook | New route: `POST /api/v1/webhooks/telephony` emitting `communication.missed_call.detected` |

---

### GAP-03 — Lead Entity (Growth OS)
**Category**: Critical
**Blocker for**: AUTO-001, AUTO-015 (Missed Call, Lead Qualification)
**Effort**: ~3 days
**Reuse %**: 60% (repository pattern established, event bus exists)
**New code**:
- `packages/db/migrations/0034_leads.sql`
- `packages/db/src/repositories/postgres/leadRepository.ts`
- `apps/api/src/services/leadService.ts`
- `apps/api/src/controllers/leadController.ts`
- `apps/web/app/business/[businessId]/workspace/leads/` (page + client)

---

### GAP-04 — Workflow Definitions in Registry
**Category**: Critical
**Blocker for**: All 15 workflows in WORKFLOW_LIBRARY
**Effort**: 1 day
**Reuse %**: 100% (workflowRegistry already accepts entries)
**New code**: Add `WorkflowDefinitionEntry` objects to `packages/registries/src/seed/`

Missing: None of the 15 automation workflows from the Workflow Library are registered as `WorkflowDefinitionEntry` in `workflowRegistry`. They exist as service implementations but not as registry entries.

---

## High Priority Gaps

### GAP-05 — Automation Event Subscribers (Loop wiring)
**Category**: High
**Description**: Even when events are emitted (GAP-02 fix), no EventBus subscriber routes them to WorkflowRuntime. The wiring `eventBus.subscribe("job.completed", → workflowRuntime.execute(WF-003))` is missing.
**Effort**: 1 day
**Location**: `apps/api/src/server.ts` (startup wiring)

---

### GAP-06 — Estimate Entity
**Category**: High
**Blocker for**: AUTO-008 (Estimate Acceptance → Job)
**Effort**: ~2 days
**New code**: `0035_estimates.sql` + estimateService + estimateController
**Note**: Invoices currently serve as draft estimates — consider extending invoice `type` enum rather than separate entity

---

### GAP-07 — Staff / Technician Entity
**Category**: High
**Blocker for**: AUTO-009 (Technician Dispatch)
**Effort**: ~2 days
**New code**: `0036_staff.sql` + staffService

---

### GAP-08 — Reminder Scheduler Rules
**Category**: High
**Blocker for**: WF-002 (appointment reminders), WF-006 (invoice follow-up), WF-013 (weekly briefing)
**Effort**: 1 day
**Reuse %**: 95% (BTE already uses same scheduler pattern)
**New code**: Register scheduler rules in `bteService` enrollment for appointment reminders + invoice monitoring

---

## Medium Priority Gaps

### GAP-09 — Growth OS Workspace Page
**Category**: Medium
**Description**: No `/workspace/leads` or growth dashboard page
**Effort**: 1 day (follows established workspace pattern)

### GAP-10 — Communication OS Workspace Page
**Category**: Medium
**Description**: No communication history, conversation thread, or notification log page
**Effort**: 2 days

### GAP-11 — DB-backed Secret Vault
**Category**: Medium
**Description**: `encryptedInMemorySecretStore` is not production-safe
**Effort**: 1 day

### GAP-12 — Referral Service
**Category**: Medium
**Blocker for**: AUTO-016
**Effort**: 1 day

### GAP-13 — Telephony Webhook
**Category**: Medium (High if missed call automation is in MVP scope)
**Effort**: 1 day — `POST /api/v1/webhooks/telephony` route

---

## Low Priority Gaps

### GAP-14 — Dynamic Feature Flags
**Effort**: 1 day — extend featureFlagService with DB table

### GAP-15 — Policy Runtime Enforcement
**Effort**: 2 days — evaluate policyRegistry entries at decision engine time

### GAP-16 — Inventory Service
**Effort**: 2 days — only needed for product-based businesses (retail, restaurant)

---

## MVP Gap Summary

| Priority | Gap | Effort | Automations Unblocked |
|----------|-----|--------|----------------------|
| Critical | GAP-01 notificationService | 2d | 12 |
| Critical | GAP-02 event emissions | 1d | 8 |
| Critical | GAP-03 lead entity | 3d | 2 |
| Critical | GAP-04 workflow registry entries | 1d | 15 |
| High | GAP-05 event→workflow wiring | 1d | all |
| High | GAP-06 estimate entity | 2d | 1 |
| High | GAP-07 staff entity | 2d | 1 |
| High | GAP-08 reminder scheduler rules | 1d | 3 |
| **Total Critical** | | **7 days** | |
| **Total High** | | **6 days** | |
| **Total MVP Effort** | | **~13 dev days** | **15 workflows** |
