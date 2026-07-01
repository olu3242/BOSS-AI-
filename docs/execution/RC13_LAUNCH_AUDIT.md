# RC1.3 — Launch Audit
## Customer Experience · Platform Operations · Support Readiness

**Date:** 2026-07-01
**Auditor:** RC1.3 Phase 0

---

## Customer Experience

### Authentication

| Check | Status | Notes |
|-------|--------|-------|
| Signup page | ❌ Missing | No `/auth/signup` page |
| Login page | ❌ Missing | No `/auth/login` page |
| Email verification | ❌ Missing | No verify flow |
| Password reset | ❌ Missing | No reset flow |
| Session persistence | ❌ Missing | No Supabase client-side session |
| Supabase JWT `org_id` claim | ❌ TD-030 | Custom access-token hook not configured |
| Dev-token bypass | ⚠️ Active | `DEMO_ORG_ID` + `/auth/dev-token` in all pages |

**Verdict:** Auth is a hard launch blocker. No real customer can register or log in. All flows use a dev-only bypass. **Defer to post-RC1 unless Supabase project is available.**

---

### Onboarding

| Check | Status | Notes |
|-------|--------|-------|
| Home page → CTA | ✅ | `/` has "Set up your business" CTA |
| Business creation form | ✅ | `/business/new` — name, industry, businessType, employees, revenue, years |
| Post-creation redirect | ✅ | Routes to `/business/[id]/mri` |
| MRI flow (5 questions) | ✅ | Identity, customers, finance, operations, goals |
| Section completion | ✅ | `completeMriSection()` called per unique section |
| Post-MRI completion | ✅ | `completeMri()` + redirect to `/mri/complete` |
| Post-MRI workspace redirect | ✅ | "View your workspace →" CTA on completion page |
| Empty state on new workspace | ✅ | "No events yet", "No KPI data yet" copy exists |
| Progress indicator in MRI | ✅ | Progress bar + question counter |

**Verdict:** Onboarding flow is functional end-to-end with dev auth.

---

### Executive Workspace

| Check | Status | Notes |
|-------|--------|-------|
| Overview tab | ✅ | Health score, KPI strip, loop status, decisions |
| Timeline tab | ✅ | Bare-array event feed with type labels |
| Approvals tab | ✅ | Decisions + recommendations; approve/reject wired |
| Automation tab | ✅ | Integrations + tool executions (startedAt fixed) |
| Intelligence tab | ✅ | Calls /kpis + /rootcause + /decisions directly |
| Settings tab | ✅ | Uses apiClient.getBusiness() with auth |
| Empty states | ✅ | All tabs have empty state messaging |
| Error states | ✅ | All tabs have error boundary with message |
| Loading states | ⚠️ Missing | No skeleton loaders — pages show nothing while loading |
| Nav shell | ✅ | 6-tab navigation layout |
| Mobile responsiveness | ⚠️ Partial | Tailwind responsive classes present; not verified |

---

### Navigation

| Check | Status | Notes |
|-------|--------|-------|
| Workspace nav | ✅ | 6 tabs with active highlight |
| Home → business creation | ✅ | Direct link |
| Business creation → MRI | ✅ | Auto-redirect |
| MRI → workspace | ✅ | Auto-redirect after completion |
| Deep links | ⚠️ Not validated | Direct URL to `/workspace/approvals` may fail without session |
| 404 handling | ✅ | API returns structured 404; frontend shows error states |
| Back navigation in MRI | ✅ | "Back" button on questions 2–5 |

---

### Error Handling

| Check | Status | Notes |
|-------|--------|-------|
| API error display | ✅ | `ApiClientError` message surfaced on all pages |
| Network failure | ⚠️ Partial | Shown as generic error; no retry CTA |
| Validation errors | ⚠️ Partial | Form required fields enforced; no inline field errors |
| 401 unauthorized | ⚠️ No redirect | Returns error message; should redirect to login |
| 404 not found | ⚠️ No dedicated page | Falls through to generic error |

---

## Platform Operations

### Logging

| Check | Status | Notes |
|-------|--------|-------|
| Request tracing | ✅ | `requestTracing()` middleware adds `x-trace-id` header |
| Request latency tracking | ✅ | ObservabilityService records P50/P95 |
| Error counter | ✅ | HTTP 5xx increments `httpErrors` |
| Structured JSON logging | ❌ Missing | Console.log only; no Pino integration |
| Log aggregator | ❌ Missing | Requires external service (Datadog, Logtail, etc.) |

---

### Metrics

| Check | Status | Notes |
|-------|--------|-------|
| `GET /metrics` endpoint | ✅ | Returns MetricSnapshot |
| HTTP requests counter | ✅ | |
| HTTP errors counter | ✅ | |
| Workflows executed | ✅ | Event-driven via `workflow.instance.completed` |
| Tool executions | ✅ | Event-driven |
| Scheduler jobs executed | ✅ | Event-driven |
| Circuit breakers opened | ✅ | Event-driven |
| Uptime | ✅ | `uptimeMs` in snapshot |
| Memory usage | ✅ | RSS + heap |
| Active orgs/businesses | ❌ Missing | No business count metric |
| Activation funnel | ❌ Missing | No MRI completion rate, health score rate |
| Internal ops dashboard | ❌ Missing | No `/ops` UI page consuming `/metrics` |

---

### Audit Trails

| Check | Status | Notes |
|-------|--------|-------|
| DurableEventBus | ✅ | All events persisted to `event_log` table |
| EventLogRepository | ✅ | `append`, `listByType`, `listByOrgId`, `listSince` |
| Business timeline | ✅ | Human-readable event feed per business |
| Decision audit | ✅ | All decision state transitions emit events |
| Approval audit | ✅ | Approve/reject logged to event bus |
| Immutable log | ✅ | Append-only design |

---

### Background Jobs

| Check | Status | Notes |
|-------|--------|-------|
| Scheduler service | ✅ | `createSchedulerService()` with cron, delayed, immediate |
| `computeNextCronRun()` | ✅ | 5-field cron parser, no external deps |
| `recoverFailed()` | ✅ | Exponential backoff retry on failed jobs |
| External trigger | ❌ Missing | `runDue()` must be called by pg_cron or Lambda |
| Scheduler UI | ❌ Missing | No operator visibility into job queue |

---

### Integrations

| Check | Status | Notes |
|-------|--------|-------|
| Provider adapters | ✅ | Gmail, Slack, Teams, MessageBird, Google Calendar, QuickBooks |
| Circuit breaker | ✅ | `circuitBreaker.ts` — CLOSED/OPEN/HALF_OPEN |
| Retry policy | ✅ | `retryPolicy.ts` — exponential backoff |
| Credential resolver | ✅ | Reads from SecretVault |
| SecretVault | ✅ | AES-256-GCM encrypted in-memory store |
| Integration connect UI | ❌ Missing | No UI to connect/disconnect integrations |
| Provider health visibility | ❌ Missing | `/providers/health` exists but no UI |

---

### Feature Flags

| Check | Status | Notes |
|-------|--------|-------|
| Feature flags in code | ❌ Missing | No feature flag system wired |
| Industry pack gating | ❌ Missing | Packs are always-on |
| Beta/gradual rollout | ❌ Missing | No cohort or flag-based rollout |

---

## Support Readiness

| Check | Status | Notes |
|-------|--------|-------|
| In-app help link | ❌ Missing | No help entry point in UI |
| "Report a problem" | ❌ Missing | No feedback/bug report mechanism |
| Diagnostic ID | ⚠️ Partial | `x-trace-id` exists per request but not surfaced to users |
| Support contact | ❌ Missing | No support contact visible in product |
| Version display | ❌ Missing | No version shown in UI |
| Knowledge base | ❌ Missing | No help content |

---

## Summary Scores

| Category | Score | Gate Status |
|----------|-------|-------------|
| Authentication | 0/7 | ❌ Blocked (TD-030) |
| Onboarding | 9/9 | ✅ Pass |
| Executive Workspace | 9/11 | ⚠️ Loading states missing |
| Error Handling | 2/5 | ⚠️ Needs retry CTA + login redirect |
| Logging | 2/5 | ⚠️ No structured logs |
| Metrics | 7/11 | ⚠️ No activation funnel, no ops dashboard |
| Audit Trails | 6/6 | ✅ Pass |
| Background Jobs | 3/5 | ⚠️ No external trigger, no scheduler UI |
| Feature Flags | 0/3 | ❌ Not implemented |
| Support | 1/6 | ❌ Nearly absent |

**RC1.3 launch readiness: NOT READY — 8 workstream items to address.**
