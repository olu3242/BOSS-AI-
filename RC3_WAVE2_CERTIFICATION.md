# RC3 Wave 2 — Revenue Operating System Certification

**Date:** 2026-07-06  
**Branch:** claude/boss-repo-normalization-n1jdx5  
**TypeScript:** Clean (0 errors)  
**Tests:** 11/11 passing

---

## What Was Built

### Phase 1 — Estimate Platform Enhancement
**File:** `apps/api/src/services/estimateService.ts`

- `markViewed(orgId, id)` — transitions `sent → viewed`, emits `estimate.viewed`
- `checkExpiry(orgId, businessId)` — scans all sent/viewed estimates past `validUntil`, transitions to `expired`, emits `estimate.expired` for each
- `computeTotals` enhanced with optional `taxRate` and `discountRate` percentage params (fallback to flat cent approach)
- Route: `POST /api/v1/businesses/:businessId/estimates/:estimateId/view`

---

### Phase 2 — Pricing Engine
**File:** `apps/api/src/services/pricingEngineService.ts`

In-memory service with:
- `addPriceRule` — flat, percentage, tiered, subscription rule types
- `addDiscountRule` — percentage or flat, auto-apply or coupon code, maxUses, expiry
- `addTaxRule` — percentage, regional, inclusive/exclusive
- `calculate(context)` — applies price rules → discounts → taxes in order; emits `pricing.calculated`
- `validateCoupon` — checks code, expiry, usage limits
- `listRules` — returns all active rules

---

### Phase 3 — Invoice Platform Enhancement
**File:** `apps/api/src/services/invoiceService.ts`

- `markViewed(orgId, invoiceId)` — emits `invoice.viewed`
- `markOverdue(orgId, businessId)` — scans all sent/viewed invoices past `dueAt`, transitions to `overdue`, emits `invoice.overdue` for each
- `cancel(orgId, invoiceId, reason?)` — transitions to `cancelled`, stores reason in metadata, emits `invoice.cancelled`
- `refund(orgId, invoiceId, amountCents, reason?)` — transitions to `refunded`, emits `invoice.refunded`
- `listOverdue(orgId, businessId)` — returns overdue invoices sorted by `dueAt`
- `applyCreditNote(orgId, invoiceId, amountCents)` — reduces `totalCents`, emits `invoice.credit_applied`

Routes added:
- `POST /businesses/:businessId/invoices/:invoiceId/view`
- `POST /businesses/:businessId/invoices/:invoiceId/cancel`
- `POST /businesses/:businessId/invoices/:invoiceId/refund`
- `GET /businesses/:businessId/invoices/overdue`

---

### Phase 4 — Payment Platform Enhancement
**File:** `apps/api/src/services/paymentService.ts`

- `refundPayment(orgId, paymentId, amountCents, reason?)` — marks payment `refunded`, emits `payment.refunded`
- `listByInvoice(orgId, invoiceId)` — delegates to `repos.payments.listByInvoice`
- `listByCustomer(orgId, customerId)` — fetches all customer invoices then fetches payments per invoice
- `recordPartialPayment(orgId, businessId, input)` — creates completed payment, sums all completed payments against invoice total, auto-marks invoice `paid` when fully covered; emits `payment.partial_received`

Routes added:
- `POST /businesses/:businessId/payments/:paymentId/refund`
- `GET /businesses/:businessId/invoices/:invoiceId/payments`

---

### Phase 5 — Collections Engine
**File:** `apps/api/src/services/collectionsService.ts`

In-memory Map-based collections service:
- `openCase` — idempotent; creates `CollectionsCase` from overdue invoice; emits `collections.case.opened`
- `sendReminder` — transitions to `in_reminder`; emits `collections.reminder.sent`
- `escalate` — transitions to `escalated`; emits `collections.case.escalated`
- `createPaymentPlan` — attaches installment plan to case
- `resolve` — closes case, zeroes outstanding balance
- `writeOff` — marks as written off
- `computeRiskScore(days, cents, history?)` — formula: `min(1, (days/90)*0.6 + previousOverdueCount*0.2 + min(0.2, cents/1_000_000))`
- `runCollectionsCycle` — calls `markOverdue`, opens cases for newly overdue, auto-sends reminders (1–14 days), auto-escalates (15–30 days)

Routes added:
- `GET /businesses/:businessId/collections`
- `POST /businesses/:businessId/collections/:caseId/remind`
- `POST /businesses/:businessId/collections/:caseId/escalate`
- `POST /businesses/:businessId/collections/:caseId/payment-plan`
- `POST /businesses/:businessId/collections/:caseId/resolve`
- `POST /businesses/:businessId/collections/:caseId/write-off`
- `POST /businesses/:businessId/collections/run-cycle`

---

### Phase 6 — Revenue Intelligence Service
**File:** `apps/api/src/services/revenueIntelligenceService.ts`

- `compute(orgId, businessId)` — full `RevenueMetrics` snapshot: paid/pending/overdue revenue, collection rate, avg days to payment, 6-month monthly trend, revenue by customer, cash flow forecast, leakage, margin analysis; emits `revenue.metrics.computed`
- `cashFlowForecast(orgId, businessId, months?)` — projects N months using historical avg × trend factor; confidence decays with horizon
- `revenueLeakage(orgId, businessId)` — overdue count, at-risk count (>60 days), total leakage cents

Routes added:
- `GET /businesses/:businessId/revenue`
- `GET /businesses/:businessId/revenue/forecast`
- `GET /businesses/:businessId/revenue/leakage`
- `GET /businesses/:businessId/cashflow`

---

### Phase 7 — Revenue Communication Service
**File:** `apps/api/src/services/revenueCommunicationService.ts`

- `sendEstimateEmail`, `sendInvoiceEmail`, `sendPaymentReminder`, `sendPaymentReceipt`, `sendCollectionsReminder`
- Routes via `NotificationService` internal channel

Event subscriptions wired in `index.ts`:
- `invoice.sent` → `sendInvoiceEmail`
- `payment.received` → `sendPaymentReceipt`
- `invoice.overdue` → `sendPaymentReminder`
- `collections.reminder.sent` → `sendCollectionsReminder`

---

### Phase 8 — AI Revenue Intelligence
**File:** `apps/api/src/services/revenueAiService.ts`

Rule-based heuristics (no external AI calls):
- `pricingRecommendation` — if estimate acceptance rate < 60% (n≥3), suggests 5–10% price reduction
- `collectionsRisk` — reuses `collectionsService.computeRiskScore`; maps risk to suggested action
- `cashFlowAlert` — compares forecast to historical avg monthly; emits low/medium/high/critical alerts
- `crossSellOpportunities` — customers with 2+ completed jobs and no recurring invoice → suggest maintenance contract

Routes added:
- `GET /businesses/:businessId/ai/revenue/pricing`
- `GET /businesses/:businessId/ai/revenue/collections-risk`
- `GET /businesses/:businessId/ai/revenue/cash-flow-alerts`
- `GET /businesses/:businessId/ai/revenue/cross-sell`

---

### Phase 9 — Executive Dashboard
**File:** `apps/api/src/services/revenueDashboardService.ts`

- `get(orgId, businessId)` — aggregates `RevenueMetrics + CollectionsCases + Estimates + Invoices` into a single `RevenueDashboard` object
- Includes: MTD/QTD/YTD revenue, pipeline stats, invoice counts, cash flow, collections summary, KPI trend updates

Route added:
- `GET /businesses/:businessId/revenue-dashboard`

---

### Phase 10 — index.ts Wiring
- Imported and instantiated all 6 new services
- `invoiceServiceInstance` shared between invoice controller and collections service
- Event subscriptions wired for all revenue communication triggers
- All new services exported from `index.ts`

---

## Domain Events Emitted

| Event | Source | Trigger |
|-------|--------|---------|
| `estimate.viewed` | estimateService | markViewed |
| `estimate.expired` | estimateService | checkExpiry |
| `invoice.viewed` | invoiceService | markViewed |
| `invoice.overdue` | invoiceService | markOverdue (per invoice) |
| `invoice.cancelled` | invoiceService | cancel |
| `invoice.refunded` | invoiceService | refund |
| `invoice.credit_applied` | invoiceService | applyCreditNote |
| `payment.refunded` | paymentService | refundPayment |
| `payment.partial_received` | paymentService | recordPartialPayment |
| `pricing.calculated` | pricingEngineService | calculate |
| `collections.case.opened` | collectionsService | openCase |
| `collections.reminder.sent` | collectionsService | sendReminder |
| `collections.case.escalated` | collectionsService | escalate |
| `revenue.metrics.computed` | revenueIntelligenceService | compute |

---

## Certified Scenarios

### Scenario 1: Full Revenue Lifecycle
`Estimate (draft) → sent → viewed → accepted → converted → Invoice (draft) → sent → viewed → Payment (completed) → Invoice (paid) → Revenue metrics show 100% collection rate`

### Scenario 2: Collections Cycle
`Invoice (sent) → markOverdue → Collections case (pending) → reminder (in_reminder) → escalate → payment plan → resolve (outstandingCents: 0)`

### Scenario 3: Pricing Engine with Tax + Discount
`Items ($100) + 10% loyalty discount + 20% coupon + 8% tax = $75.60 total. Tiered pricing: 8 units at tier 2 rate ($9 each = $72).`

---

## Security Compliance

- `org_id` extracted from route/service parameters only — never from `req.body`
- No secret vault keys referenced in new code
- No ciphertext/iv/auth_tag fields in any response
- All new routes use `await requireOrgId(req)` for authentication
