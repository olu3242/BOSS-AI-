# RC1.5 Load Test Report

**Date:** 2026-07-03  
**Environment:** In-memory (no Postgres). Postgres benchmarks deferred to RC2.

---

## Summary

All load validation targets met. No O(n²) patterns detected. Memory growth is bounded.

---

## Results

| Test Scenario | Volume | Time Limit | Actual | Result |
|--------------|--------|-----------|--------|--------|
| Business creation (parallel) | 100 businesses, 10 orgs | 2s | < 500ms typical | PASS |
| Workflow execution writes | 1000 records | 3s | < 1s typical | PASS |
| Event log appends | 10,000 events | 10s | < 3s typical | PASS |
| Event log memory growth | 10,000 events | < 100MB heap | < 15MB observed | PASS |
| Scheduler job throughput | 200 jobs create + list | 1s | < 200ms typical | PASS |
| Concurrent full analyses | 10 parallel MRI+DNA+Health | 5s | < 2s typical | PASS |
| Task execution queue depth | 500 tasks + count | 2s | < 500ms typical | PASS |

---

## Concurrency Observations

10 concurrent full business analyses (MRI → DNA → Health) completed without data leakage between org tenants. Each org's health score was independent and correct. No race conditions detected in in-memory implementations.

## O(n²) Analysis

No in-memory service iterates over a global collection when scoped reads are available. All repository `list*` operations scope by `orgId` first. Event log pagination via `limit` parameter prevents unbounded reads.

## Tenant Isolation Under Load

With 100 businesses across 10 orgs (10 each), per-org `list()` returns exactly 10 records — no cross-contamination under concurrent writes.

---

## Gaps & RC2 Prerequisites

1. **Postgres benchmarks required** — in-memory tests validate algorithm correctness but not DB query performance. Postgres index coverage for `org_id + business_id` queries must be load-tested before GA.
2. **Connection pool limits** — simultaneous concurrent analyses under real load will stress PG connection pool. `SUPABASE_DB_POOL_SIZE` must be tuned for expected peak (recommended: 20-50 for 100 concurrent businesses).
3. **Event log compaction** — 10K events per org accumulate in DB. A compaction/archival policy is needed before GA (see TECH_DEBT.md TD-030).
