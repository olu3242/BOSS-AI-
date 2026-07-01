# RC1.1 — Endpoint Mapping
## Every Backend Route → Frontend Consumer

**Date:** 2026-07-01
**Backend routes audited:** 66 routes across `apps/api/src/http/server.ts`

Legend: ✅ Wired | ⚠️ Partial | ❌ Missing | 🔧 Broken

---

## Authentication

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/auth/dev-token` | `getDevToken()` (internal) | — (dev-only) | ⚠️ Dev-only placeholder |

---

## Business

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses` | `createBusiness()` | `/business/new` | ⚠️ Partial — `businessType` bug |
| GET | `/businesses/:id` | `getBusiness()` | `/business/[id]/workspace/settings` | 🔧 Broken — no auth header |

---

## Business MRI (Onboarding)

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/mri` | ❌ None | ❌ None | ❌ Missing |
| POST | `/mri/:id/answers` | ❌ None | ❌ None | ❌ Missing |
| POST | `/mri/:id/sections/:key/complete` | ❌ None | ❌ None | ❌ Missing |
| POST | `/mri/:id/complete` | ❌ None | ❌ None | ❌ Missing |
| GET | `/mri/:id/responses` | ❌ None | ❌ None | ❌ Missing |

---

## Business DNA

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/dna` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/dna` | ❌ None | ❌ None | ❌ Missing |

---

## Business Health

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/health` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/health` | `getHealth()` (via getWorkspace) | `/business/[id]/workspace` | ⚠️ Indirect via workspace snapshot |

---

## Capabilities

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/capabilities` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/capabilities` | ❌ None | ❌ None | ❌ Missing |

---

## Timeline

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| GET | `/businesses/:id/timeline` | `getTimeline()` | `/business/[id]/workspace/timeline` | ⚠️ Partial — mock auth |

---

## Constraints

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/constraints/analyze` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/constraints` | (via workspace) | `/business/[id]/workspace` (counter) | ⚠️ Count only, no list |
| GET | `/businesses/:id/constraints/priorities` | ❌ None | ❌ None | ❌ Missing |
| POST | `/constraints/:id/status` | ❌ None | ❌ None | ❌ Missing |
| POST | `/constraints/:id/dismiss` | ❌ None | ❌ None | ❌ Missing |

---

## Recommendations

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/recommendations/analyze` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/recommendations` | (via workspace) | `/business/[id]/workspace/approvals` (pending only) | ⚠️ Partial — proposed only |
| GET | `/businesses/:id/recommendations/priorities` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/recommendations/roadmap` | ❌ None | ❌ None | ❌ Missing |
| POST | `/recommendations/:id/status` | ❌ None | ❌ None | ❌ Missing |
| POST | `/recommendations/:id/dismiss` | ❌ None | ❌ None | ❌ Missing |
| POST | `/recommendations/:id/approve` | `approveRecommendation()` | `/business/[id]/workspace/approvals` | 🔧 Broken — button disabled |

---

## Integrations & Tool Fabric

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/integrations/:key/connect` | ❌ None | ❌ None | ❌ Missing |
| POST | `/businesses/:id/integrations/:key/disconnect` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/integrations` | `getIntegrations()` | `/business/[id]/workspace/automation` | ⚠️ Partial — mock auth |
| POST | `/businesses/:id/permissions` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/permissions` | ❌ None | ❌ None | ❌ Missing |
| POST | `/businesses/:id/tools/requests` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/tools/executions` | `getToolExecutions()` | `/business/[id]/workspace/automation` | 🔧 Broken — `executedAt` bug |
| GET | `/businesses/:id/tools/audit` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/providers/health` | ❌ None | ❌ None | ❌ Missing |

---

## Mission Control

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| GET | `/businesses/:id/mission-control` | ❌ Not in apiClient | `/business/[id]/mission-control` | ⚠️ Page exists; wiring unknown |

---

## Decision Intelligence

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/decisions/generate` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/decisions` | (via workspace) | `/business/[id]/workspace` + `/intelligence` | ⚠️ Partial — read-only via workspace |
| GET | `/businesses/:id/decisions/priorities` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/decisions/optimize` | ❌ None | ❌ None | ❌ Missing |
| GET | `/decisions/:id/brief` | ❌ None | ❌ None | ❌ Missing |
| POST | `/decisions/:id/evaluate` | ❌ None | ❌ None | ❌ Missing |
| POST | `/decisions/:id/approve` | `approveDecision()` | `/business/[id]/workspace/approvals` | 🔧 Broken — button disabled |
| POST | `/decisions/:id/reject` | `rejectDecision()` | `/business/[id]/workspace/approvals` | 🔧 Broken — button disabled |
| POST | `/decisions/:id/schedule` | ❌ None | ❌ None | ❌ Missing |
| POST | `/decisions/:id/measure` | ❌ None | ❌ None | ❌ Missing |
| POST | `/decisions/:id/archive` | ❌ None | ❌ None | ❌ Missing |

---

## Scenarios

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/scenarios` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/scenarios` | ❌ None | ❌ None | ❌ Missing |
| POST | `/businesses/:id/scenarios/compare` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/forecasts` | ❌ None | ❌ None | ❌ Missing |

---

## KPIs & Analysis

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| GET | `/businesses/:id/kpis` | (via workspace) | `/business/[id]/workspace/intelligence` | ⚠️ Indirect — intelligence page calls getWorkspace instead |
| GET | `/businesses/:id/rootcause` | ❌ None | ❌ None | ❌ Missing |

---

## Execution Planning & Verification

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/plans/:decisionId` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/plans/:decisionId` | ❌ None | ❌ None | ❌ Missing |
| POST | `/businesses/:id/verification/:decisionId` | ❌ None | ❌ None | ❌ Missing |
| GET | `/businesses/:id/verification/:decisionId` | ❌ None | ❌ None | ❌ Missing |

---

## Operating Loop & Multi-Agent

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| POST | `/businesses/:id/operating-loop/run` | ❌ None | ❌ None | ❌ Missing |
| POST | `/businesses/:id/multi-agent/delegate` | ❌ None | ❌ None | ❌ Missing |

---

## Workspace (Goal 22)

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| GET | `/businesses/:id/workspace` | `getWorkspace()` | `/business/[id]/workspace` | ⚠️ Partial — mock auth |
| GET | `/businesses/:id/approvals` | `getPendingApprovals()` | `/business/[id]/workspace/approvals` | ⚠️ Partial — buttons disabled |

---

## Observability

| Method | Route | apiClient Method | Frontend Page | Status |
|--------|-------|-----------------|---------------|--------|
| GET | `/metrics` | ❌ None | ❌ None | RC3 — not RC1 scope |

---

## Coverage Summary

| Status | Count | Percentage |
|--------|-------|------------|
| ✅ Fully wired | 0 | 0% |
| ⚠️ Partial (mock auth or indirect) | 10 | ~15% |
| 🔧 Broken (type error or disabled) | 5 | ~8% |
| ❌ Missing entirely | 51 | ~77% |
| **Total routes** | **66** | — |

**RC1.1 target: All customer journey endpoints wired, tested, and using real auth.**
RC1 scope (minimum): Auth, MRI, Business creation, Health, Workspace, Approvals.
