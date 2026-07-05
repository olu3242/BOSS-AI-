# RC3 Batch 1 — Architecture Certification Report

> Generated: 2026-07-05 | Status: ✅ CERTIFIED — READY TO IMPLEMENT

---

## Certification Scope

Batch 1 adds 6 new entities: **Staff**, **Opportunity**, **Conversation**, **Task** (enriched standalone), **Document**, **Estimate**.

---

## Phase 0 Checks

### ✅ Entity Uniqueness
- None of the 6 new entities exist in any migration (0001–0034)
- `Task` interface exists in `packages/types/src/ontology.ts:174` as a minimal stub (only `id, businessId, title, status, assigneeId`). Batch 1 enriches this type — it is not a duplicate.
- `DiagnosticOpportunity` in `types/src/diagnostic.ts:86` is a read-only analytics type, NOT the same as a sales `Opportunity` entity. No conflict.

### ✅ Entity Ownership
| Entity | Owner OS | Controller | Service |
|--------|----------|-----------|--------|
| Staff | Business OS | staffController | staffService |
| Opportunity | Customer & Sales OS | opportunityController | opportunityService |
| Conversation | Customer & Sales OS | conversationController | conversationService |
| Task | Business OS | taskController | taskService |
| Document | Business OS | documentController | documentService |
| Estimate | Customer & Sales OS | estimateController | estimateService |

### ✅ Relationship Validity
All 6 entities reference:
- `organizations(id)` via `org_id` — ✅ exists
- `businesses(id)` via `business_id` — ✅ exists
- `customers(id)` via `customer_id` (Opportunity, Conversation, Estimate) — ✅ exists
- `leads(id)` via `lead_id` (Opportunity) — ✅ migration 0034 exists
- `invoices(id)` via `converted_invoice_id` (Estimate) — ✅ migration 0028 exists
- `tasks(id)` self-referential parent (Task) — ✅ will be created in same migration

### ✅ API Mapping
Each entity gets: GET collection, GET by id, POST, PATCH, DELETE (soft). No collision with existing routes.

### ✅ Canonical Events
Every lifecycle transition maps to canonical event type from `EVENT_ARCHITECTURE.md`.

### ✅ AI Agent Permissions
- Staff: read by all employees; write by HR/Operations AI
- Opportunity: read/write by Sales AI
- Conversation: read/write by Customer Success AI
- Task: read/write by Operations AI
- Document: read-only for AI agents; write by human only
- Estimate: read/write by Billing AI (approval_required)

### ✅ KPI Ownership
- Staff utilization KPI: `smb_employee_utilization` (smb_coo) — already registered
- Opportunity pipeline KPI: `smb_lead_conversion_rate` (smb_sales_manager) — already registered
- Conversation response time: new KPI `smb_customer_response_time` — to be registered in Batch 2

---

## Issues Found

| # | Severity | Description | Resolution |
|---|---------|-------------|-----------|
| 1 | LOW | `Task` type in ontology.ts is a minimal stub | Enrich in Batch 1 (additive — no breaking change) |
| 2 | LOW | `TaskStatus` values differ from canonical spec | Align to `todo\|in_progress\|blocked\|done\|cancelled` in Batch 1 |
| 3 | INFO | No existing migration conflicts | None required |

---

## ✅ CERTIFICATION PASSED

All checks pass. Proceeding to Phase 1.
