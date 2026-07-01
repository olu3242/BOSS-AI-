# GOAL 21 — Autonomous Operating Loop Certification

**Date:** 2026-06-30
**Status:** CERTIFIED

---

## Loop Specification

The BOSS Autonomous Business Operating Loop executes a deterministic 8-phase cycle:

| Phase | Purpose | Implementation | Status |
|-------|---------|----------------|--------|
| **Observe** | Collect all business signals | Read events, workflows, constraints, recommendations, health, DNA | ✅ |
| **Analyze** | Derive KPIs + root causes | `deriveKpiReadings()` + `analyzeRootCauses()` | ✅ |
| **Decide** | Generate decision from recommendations | `generateDecision()` → `BusinessDecisionRepository.create()` | ✅ |
| **Plan** | Create execution plan for high-confidence decisions | `createExecutionPlan()` → `MemoryRecordRepository.upsert()` | ✅ |
| **Execute** | Record execution intent + queue workflows | Phase summary recorded; delegates to Loop Runtime | ✅ |
| **Verify** | Snapshot state for future verification | `MemoryRecordRepository.upsert(loop_snapshot)` | ✅ |
| **Learn** | Record loop learnings to organizational memory | `MemoryRecordRepository.upsert(loop_learning)` | ✅ |
| **Improve** | Surface improvement opportunities from root causes | Count + summarize improvement signals | ✅ |

---

## Loop Guarantees

### Resumable
The loop stores snapshots and baselines in `MemoryRecordRepository` at the start and end of each run. A failed run can be restarted with the same businessId and the state is reconstructed from repos.

### Idempotent
Each run generates a unique `runId` (UUID) so multiple runs don't collide. All memory writes use `upsert()` with stable keys. Repo reads are non-destructive.

### Event-driven
Every phase that produces state emits a domain event:
- `business.decision.generated`
- `business.plan.created`
- `business.loop.completed`
- `business.outcome.verified` (verification service)
- `business.learning.recorded` (verification service)
- `business.kpi.measured` (measurement service)
- `business.rootcause.detected` (root cause service)

### Auto-approve Threshold
Decisions with `confidenceScore >= 0.75` receive automatic plan creation. Lower confidence decisions are flagged for manual approval before planning.

---

## Phase Verification Results (Test Coverage)

| Test | Result |
|------|--------|
| Full 8-phase loop runs successfully | ✅ |
| All 8 phase names present in result | ✅ |
| `business.loop.completed` event emitted | ✅ |
| Decide phase skips when health is missing | ✅ |
| Plan phase skips when health is missing | ✅ |
| Observe phase captures constraints | ✅ |
| Analyze phase derives KPI readings | ✅ |
| Multiple runs produce unique runIds | ✅ |

---

## HTTP API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/v1/businesses/:id/operating-loop/run` | Run full 8-phase loop |
| `POST` | `/api/v1/businesses/:id/plans/:decisionId` | Create execution plan |
| `GET` | `/api/v1/businesses/:id/plans/:decisionId` | Retrieve execution plan |
| `POST` | `/api/v1/businesses/:id/verification/:decisionId` | Verify decision outcome |
| `GET` | `/api/v1/businesses/:id/verification/:decisionId` | Retrieve verification result |

All routes extract `orgId` from JWT. No business ID from request body.
