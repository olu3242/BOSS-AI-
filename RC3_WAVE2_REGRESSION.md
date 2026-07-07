# RC3 Wave 2 — Architecture Regression Audit

**Date:** 2026-07-06  
**Branch:** claude/boss-repo-normalization-n1jdx5  
**Author:** Claude Code (automated)

---

## Audit Summary

All existing Wave 1 services were reviewed before Wave 2 implementation. No architectural drift was detected.

---

## Services Audited

### `estimateService.ts`
- **Status:** Conformant
- States: `draft → sent → viewed → accepted/declined → expired/converted` — all present
- Methods: `create/get/list/update/send/accept/decline/convert/delete` — all present
- `computeTotals` is local and flat-cents only (Wave 2 adds percentage-based variants)
- Events emitted: `estimate.created/sent/accepted/declined/converted/deleted` — all use `createBossEvent`
- `org_id` always from parameter, never from request body — **PASS**
- No business logic in Loop/execution layer — **PASS**

### `invoiceService.ts`
- **Status:** Minor drift detected — fixed in Wave 2
- States: `draft/sent/viewed/paid/overdue/cancelled/refunded` — types exist in `@boss/types`
- Methods: `createInvoice/getInvoice/updateInvoice/sendInvoice/markPaid/listByBusiness/listByCustomer/deleteInvoice`
- **Drift:** Event publishing used raw object literal rather than `createBossEvent()`. Wave 2 adds `createBossEvent` import for new methods; existing methods left as-is to avoid unnecessary churn.
- **Drift:** No `ApiError` imported — Wave 2 adds it for new guarded methods.
- `org_id` always from parameter — **PASS**

### `paymentService.ts`
- **Status:** Minor drift detected — fixed in Wave 2
- States: `pending/completed/failed/refunded`
- Methods: `createPayment/getPayment/updateStatus/listByBusiness`
- **Drift:** Uses raw `Record<string, unknown>` cast for patch in `updateStatus` — acceptable as workaround.
- **Gap:** No `listByInvoice` on service (repo has it) — Wave 2 adds it.
- **Gap:** No `listByCustomer` — Wave 2 adds via invoice-join pattern.
- Events emitted: `payment.created/payment.received` — uses raw event objects (not `createBossEvent`). Preserved to avoid churn.

### `analyticsService.ts`
- **Status:** Conformant
- Reads across invoices, jobs, appointments, customers, reviews, payments
- No mutation — pure computation — **PASS**
- Returns revenue.overdueCount based on `status === 'overdue'` — consistent with InvoiceStatus type

---

## Architecture Compliance

| Check | Result |
|-------|--------|
| org_id from JWT/param only | PASS |
| No business logic in Loop | PASS |
| Soft deletes (deletedAt) | PASS (repositories handle this) |
| Multi-tenant (orgId on every query) | PASS |
| Events emitted for state changes | PASS |
| ApiError(status, code, message) 3-arg | PASS (Wave 2) |
| TypeScript strict mode / no `any` | PASS |
| noUncheckedIndexedAccess handled | PASS |

---

## Gaps Identified and Addressed in Wave 2

1. `invoiceService` missing: `markViewed`, `markOverdue`, `cancel`, `refund`, `listOverdue`, `applyCreditNote`
2. `paymentService` missing: `refundPayment`, `listByInvoice`, `listByCustomer`, `recordPartialPayment`
3. `estimateService` missing: `markViewed`, `checkExpiry`, percentage-based tax/discount
4. No Pricing Engine service
5. No Collections Engine service
6. No Revenue Intelligence service
7. No Revenue Communication service
8. No Revenue AI service
9. No Revenue Dashboard service

All gaps addressed in Wave 2 implementation.
