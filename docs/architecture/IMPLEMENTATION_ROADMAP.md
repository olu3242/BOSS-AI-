# IMPLEMENTATION ROADMAP
> Generated: 2026-07-05 | Phased execution batches to full automation certification

All batches must: compile, pass lint (0 warnings), pass typecheck (0 errors), pass all tests, maintain backwards compatibility, never reduce coverage.

---

## Batch 1 — Runtime Foundation (Week 1)
**Goal**: Close all Critical gaps. Every automation has a path to execution.

### B1-T1: Event Emissions (GAP-02)
Add `eventBus.publish()` to 8 services. Zero new files — all reuse.

```
apps/api/src/services/customerService.ts      → customer.created
apps/api/src/services/jobService.ts           → job.completed, job.created
apps/api/src/services/paymentService.ts       → payment.received
apps/api/src/services/invoiceService.ts       → invoice.paid, invoice.created
apps/api/src/services/appointmentService.ts   → appointment.created
apps/api/src/services/reviewService.ts        → review.received
apps/api/src/services/kpiMeasurementService.ts → kpi.threshold.exceeded
```

Acceptance: All 536 existing tests pass + new tests for each emission.

### B1-T2: Canonical Notification Service (GAP-01)
```
packages/db/migrations/0031_notification_deliveries.sql
apps/api/src/services/notificationService.ts
apps/api/src/controllers/notificationController.ts (optional)
```

Acceptance: `notificationService.send({ channel: "sms", ... })` routes to `twilioSmsAdapter`, emits `notification.sent`, persists delivery record.

### B1-T3: Workflow Registry Entries (GAP-04)
```
packages/registries/src/seed/workflows.ts    (new — 15 WorkflowDefinitionEntry objects)
packages/registries/src/seed/index.ts        (add workflows to seed)
```

Acceptance: All 15 workflows from WORKFLOW_LIBRARY registered with correct trigger types, OS owners, KPI mappings.

### B1-T4: Event → Workflow Wiring (GAP-05)
```
apps/api/src/server.ts    — add EventBus subscriptions at startup
```

Wire: `job.completed` → WF-003 + WF-005, `customer.created` → WF-012, `payment.received` → WF-007, `invoice.paid` → WF-011, etc.

Acceptance: Integration test for each subscription.

---

## Batch 2 — Work OS & Money OS (Week 2)
**Goal**: Work and Money OS fully automated.

### B2-T1: Lead Entity (GAP-03)
```
packages/db/migrations/0034_leads.sql
packages/db/src/repositories/postgres/leadRepository.ts
apps/api/src/services/leadService.ts
apps/api/src/controllers/leadController.ts
apps/web/app/business/[businessId]/workspace/leads/page.tsx
apps/web/app/business/[businessId]/workspace/leads/loading.tsx
```

### B2-T2: Estimate Entity (GAP-06)
Decision: Extend `invoices` table with `type: "estimate" | "invoice"` and `status: "draft" | "sent" | "accepted" | "declined"`.
```
packages/db/migrations/0035_invoice_types.sql    (ALTER TABLE + index)
apps/api/src/services/invoiceService.ts          (extend with estimate methods)
```

### B2-T3: Staff / Technician Entity (GAP-07)
```
packages/db/migrations/0036_staff.sql
packages/db/src/repositories/postgres/staffRepository.ts
apps/api/src/services/staffService.ts
apps/api/src/controllers/staffController.ts
```

### B2-T4: Reminder Scheduler Rules (GAP-08)
Wire appointment reminder and invoice overdue cron rules into `bteService.scheduleDailyCycle()` pattern.
```
apps/api/src/services/appointmentReminderService.ts    (new — wraps scheduler + notification)
apps/api/src/services/invoiceMonitorService.ts         (new — overdue detection + notification)
```

---

## Batch 3 — Communication OS & Growth OS (Week 3)
**Goal**: All communication channels canonical. Growth pipeline operational.

### B3-T1: Telephony Webhook (GAP-13)
```
apps/api/src/controllers/webhookController.ts    (new — POST /api/v1/webhooks/telephony)
```
Emits `communication.missed_call.detected` → WF-001 fires.

### B3-T2: Growth OS Workspace Pages
```
apps/web/app/business/[businessId]/workspace/leads/
apps/web/app/business/[businessId]/workspace/pipeline/  (optional: kanban view)
```

### B3-T3: Referral Service (GAP-12)
```
packages/db/migrations/0037_referrals.sql
apps/api/src/services/referralService.ts
```

### B3-T4: Re-engagement Campaign Workflow
Wire `customer.inactive.detected` emission in `customerHealthService` (scheduled check).

---

## Batch 4 — Intelligence Expansion (Week 4)
**Goal**: Advanced intelligence, prediction, forecasting.

### B4-T1: KPI Threshold Configuration
```
packages/db/migrations/0038_kpi_thresholds.sql
apps/api/src/services/kpiThresholdService.ts
```
Allow per-business KPI threshold configuration. Drives WF-014.

### B4-T2: Prediction & Forecasting
Extend MCP with:
```
packages/mcp/src/intelligence/forecastEngine.ts      (revenue forecasting)
packages/mcp/src/intelligence/churnPrediction.ts     (customer churn prediction)
```

### B4-T3: DB-backed Secret Vault (GAP-11)
```
packages/db/migrations/0032_provider_credentials.sql
apps/api/src/services/secretVault/dbSecretStore.ts
```

### B4-T4: Dynamic Feature Flags (GAP-14)
```
packages/db/migrations/0033_feature_flags.sql
apps/api/src/services/featureFlagService.ts           (extend — DB + env fallback)
```

---

## Batch 5 — Marketplace & AI Workforce (Week 5)
**Goal**: Every industry pack certified. AI workforce fully operational.

### B5-T1: AI Workforce Dashboard
```
apps/web/app/business/[businessId]/workspace/ai-workforce/page.tsx
apps/web/app/business/[businessId]/workspace/ai-workforce/loading.tsx
```

### B5-T2: Industry Pack Certification
Run `certifyPlatform()` against all 11 industry packs. All must return `GO`.

### B5-T3: Marketplace Template Activation
Wire `capability.pack.installed` event → auto-enroll workflows from pack into business's workflow registry.

### B5-T4: Policy Runtime Enforcement (GAP-15)
```
apps/api/src/services/policyEnforcementService.ts    (new — evaluate policyRegistry at decision time)
```

---

## Batch 6 — Production Hardening (Week 6)
**Goal**: Production-safe deployment. All certifications pass.

### B6-T1: Automation Certification Run
Re-run AUTOMATION_CERTIFICATION_MATRIX against live platform. All automations must reach PASS or PARTIAL (no BLOCKED).

### B6-T2: Load Testing
- BTE cycle: 100 businesses concurrently
- Workflow execution: 1000 concurrent steps
- Notification delivery: 10,000/hour

### B6-T3: End-to-End Automation Tests
Add E2E test for each PASS automation:
```
apps/api/src/__tests__/automation_e2e_wf001.test.ts
apps/api/src/__tests__/automation_e2e_wf002.test.ts
... (one per workflow)
```

### B6-T4: Lighthouse Audit
Achieve Performance ≥ 90, Accessibility ≥ 95 on all workspace pages.

---

## Batch Acceptance Criteria (All Batches)

| Check | Tool | Required |
|-------|------|---------|
| TypeScript compile | `tsc --noEmit` | 0 errors |
| Lint | `eslint --max-warnings=0` | 0 warnings |
| Tests | `npx turbo run test` | All pass, no reduction in count |
| Knip | `npx knip` | 0 unused exports |
| Build | `npx turbo run build` | All packages build |
