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
**Status:** Closed  
**Context:** `scheduler_jobs` partially tracks execution metadata. No `execution_metrics` table for P50/P95 per workflow.  
**Risk:** Low — observability gap only  
**Owner:** RC2

### TD-023 — AI Employees in Draft Lifecycle
**Status:** Open  
**Context:** All seeded employees are `lifecycle: "draft"`. No lifecycle management UI.  
**Risk:** Low — backend complete, UI pending  
**Owner:** Web app phase

### TD-024 — AI Employee Handler Has No Real LLM Inference
**Status:** Closed (RC5)  
**Context:** The `ai` task type handler in Loop runtime does not call Claude API. Returns deterministic mock.  
**Risk:** Medium — AI workforce execution not yet live  
**Owner:** RC2 AI workforce sprint

### TD-030 — Event Log Compaction
**Status:** Closed (RC5)
**Context:** Event log is append-only with no archival policy. Under production load, 10K+ events/org/day accumulate indefinitely.  
**Risk:** Medium for storage costs at scale  
**Resolution:** Migration 0044 adds `compact_event_log(retention_days, org_id)` Postgres function + `event_log_compaction_runs` audit table. `EventLogRepository.compact()` method added to both Postgres and in-memory implementations. `EventLogCompactionService` provides `compactForOrg` / `compactAll` — call from scheduler or cron. Default 90-day retention.
**Owner:** RC2 infra

### TD-031 — Rate Limiting
**Status:** Open (identified in RC1.5 security review)  
**Context:** No per-tenant rate limiting on API endpoints.  
**Risk:** High — abuse vector for multi-tenant platform  
**Recommendation:** Implement token bucket per `org_id` at API gateway or middleware layer  
**Owner:** RC2 security sprint

### TD-032 — Postgres RLS Integration Tests
**Status:** Closed (RC5)  
**Context:** All isolation tests run against in-memory repos. Real Postgres RLS policies are deployed but not tested in CI.  
**Risk:** Medium — in-memory tests pass but Postgres policies could have gaps  
**Resolution:** Added `packages/db/src/__tests__/rls.test.ts` + `rlsSetup.ts` with Docker globalSetup. Validates cross-tenant isolation on workflow_executions, jobs, appointments, invoices, agent_executions. Run via `pnpm --filter @boss/db test:rls`. Skips cleanly when Docker daemon is unavailable.  
**Owner:** RC2

### TD-033 — Prometheus / OTEL Metrics Export
**Status:** Closed (RC5)
**Context:** Internal counters exist (`ObservabilityService`) but are not exported to any external metrics system.  
**Risk:** Low during beta, high for production operations  
**Resolution:** Added `GET /metrics/prometheus` endpoint (no auth, scraper-friendly) that serializes `MetricSnapshot` to Prometheus exposition text format (text/plain; version=0.0.4). Compatible with Prometheus, Grafana Cloud, and OTEL collectors. No SDK dependency — pure string serialization in `prometheusFormat.ts`. 5 unit tests validate format correctness including `_total` suffix convention.
**Owner:** RC2 observability sprint

### TD-034 — Alerting Rules
**Status:** Closed (RC5)
**Context:** No alerting rules defined for dead letter threshold, health endpoint degradation, or scheduler failures.  
**Resolution:** `AlertingService` with three edge-triggered rules (DEAD_LETTERS_HIGH/critical, HEALTH_DEGRADED/warning, SCHEDULER_RECOVERED_HIGH/warning). Emits `alert.fired` / `alert.resolved` domain events on the EventBus so Slack/PagerDuty sinks can subscribe. Firing alerts surfaced on `GET /health` response and `boss_alerts_firing` Prometheus gauge. 14 unit tests covering all rules, edge-trigger deduplication, resolution, and event emission.
**Owner:** RC2 operations

---

## Closed Items

| ID | Description | Closed In |
|----|-------------|-----------|
| TD-017 | Task timeout enforcement | Goal 17 (Scheduler) |
| TD-018 | Parallel step fan-out | Goal 17 (Scheduler) |
| TD-019 | `ParallelStepGroup` type contract | Goal 17 (Scheduler) |
| TD-021 | Domain events in-process only | RC1 WS4 (DurableEventBus) |
| TD-024 | AI Employee Handler Has No Real LLM Inference | RC4 |
| TD-028 | No Zod validation on HTTP bodies | Goals 21-23 |
| TD-030 | Event Log Compaction | RC5 |
| TD-031 | Rate Limiting | RC5 |
| TD-032 | Postgres RLS Integration Tests | RC5 |
| TD-033 | Prometheus / OTEL Metrics Export | RC5 |
| TD-034 | Alerting Rules | RC5 |




---

## RC2 Phase A Deferred Items

### TD-035 — Landing page inline styles vs Tailwind tokens
**Status:** Open (identified RC2 Phase A)  
**Context:** New marketing components use inline styles with hardcoded values rather than Tailwind token classes. Values are semantically aligned but not DRY.  
**Recommendation:** Migrate marketing components to use CSS variables from `landing.css` or Tailwind token classes in RC2 Phase C.  
**Risk:** Low — styling is correct, just not unified with the token system  
**Owner:** RC2 Phase C

### TD-036 — Demo video CTA
**Status:** Open (identified RC2 Phase A)  
**Context:** "Watch 2-min demo" CTA in HeroSection links to `/waitlist`. No actual demo video exists.  
**Recommendation:** Create a 2-minute product walkthrough video and host it, or replace CTA with "Book a live demo" until video is ready.  
**Risk:** Medium — dishonest CTA erodes trust  
**Owner:** Marketing / RC2 Phase B

### TD-037 — Placeholder testimonials
**Status:** Open (identified RC2 Phase A)  
**Context:** Three testimonials in page.tsx are clearly placeholder copy. Must be replaced before any public-facing launch.  
**Recommendation:** Gather 3 real customer quotes from beta users.  
**Risk:** High before launch — fake testimonials are a legal and trust liability  
**Owner:** Customer Success / RC2 Phase B

### TD-038 — Onboarding flow not built
**Status:** Open (identified RC2 Phase A)  
**Context:** No `/onboarding` route exists. New users land on dashboard without guidance.  
**Recommendation:** Build guided onboarding wizard: questionnaire → Health Report → activate AI team member. This is the highest-priority UX gap.  
**Risk:** High — directly impacts early retention  
**Owner:** RC2 Phase B
