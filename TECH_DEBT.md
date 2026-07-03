# BOSS Technical Debt Register

Last updated: 2026-07-03

---

## Open Items

### TD-013 — Provider Simulations
**Status:** Open  
**Context:** 13 of 19 providers are simulated (HTTP mock responses). Real HTTP adapters exist for Twilio, Gmail, Slack, Teams, MessageBird, Microsoft365, Google Calendar, QuickBooks (8 total).  
**Risk:** Medium — integration correctness unverified for simulated providers  
**Owner:** RC2

### TD-014 — No External KMS Driver
**Status:** Open  
**Context:** SecretVault uses in-memory encrypted store or env vars. No Vault/AWS Secrets Manager integration.  
**Risk:** High for production — secrets not HSM-protected  
**Owner:** RC2 hardening sprint

### TD-020 — No Dedicated Execution Metrics Table
**Status:** Open  
**Context:** `scheduler_jobs` partially tracks execution metadata. No `execution_metrics` table for P50/P95 per workflow.  
**Risk:** Low — observability gap only  
**Owner:** RC2

### TD-023 — AI Employees in Draft Lifecycle
**Status:** Open  
**Context:** All seeded employees are `lifecycle: "draft"`. No lifecycle management UI.  
**Risk:** Low — backend complete, UI pending  
**Owner:** Web app phase

### TD-024 — AI Employee Handler Has No Real LLM Inference
**Status:** Open  
**Context:** The `ai` task type handler in Loop runtime does not call Claude API. Returns deterministic mock.  
**Risk:** Medium — AI workforce execution not yet live  
**Owner:** RC2 AI workforce sprint

### TD-030 — Event Log Compaction
**Status:** Open  
**Context:** Event log is append-only with no archival policy. Under production load, 10K+ events/org/day accumulate indefinitely.  
**Risk:** Medium for storage costs at scale  
**Recommendation:** Implement rolling window (keep 90 days), archive to cold storage  
**Owner:** RC2 infra

### TD-031 — Rate Limiting
**Status:** Open (identified in RC1.5 security review)  
**Context:** No per-tenant rate limiting on API endpoints.  
**Risk:** High — abuse vector for multi-tenant platform  
**Recommendation:** Implement token bucket per `org_id` at API gateway or middleware layer  
**Owner:** RC2 security sprint

### TD-032 — Postgres RLS Integration Tests
**Status:** Open (identified in RC1.5)  
**Context:** All isolation tests run against in-memory repos. Real Postgres RLS policies are deployed but not tested in CI.  
**Risk:** Medium — in-memory tests pass but Postgres policies could have gaps  
**Recommendation:** Add a test mode that spins up a real Postgres instance (e.g., via Docker) and runs the security validation suite against it  
**Owner:** RC2

### TD-033 — Prometheus / OTEL Metrics Export
**Status:** Open (identified in RC1.5)  
**Context:** Internal counters exist (`ObservabilityService`) but are not exported to any external metrics system.  
**Risk:** Low during beta, high for production operations  
**Owner:** RC2 observability sprint

### TD-034 — Alerting Rules
**Status:** Open (identified in RC1.5)  
**Context:** No alerting rules defined for dead letter threshold, health endpoint degradation, or scheduler failures.  
**Recommendation:** Define PagerDuty/Slack alert rules: dead_letters > 10, health != "ok", scheduler recovered > 5 in 1h  
**Owner:** RC2 operations

---

## Closed Items

| ID | Description | Closed In |
|----|-------------|-----------|
| TD-017 | Task timeout enforcement | Goal 17 (Scheduler) |
| TD-018 | Parallel step fan-out | Goal 17 (Scheduler) |
| TD-019 | `ParallelStepGroup` type contract | Goal 17 (Scheduler) |
| TD-021 | Domain events in-process only | RC1 WS4 (DurableEventBus) |
| TD-028 | No Zod validation on HTTP bodies | Goals 21-23 |
