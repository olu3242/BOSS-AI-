# MVP Journey Certification Baseline

Date: 2026-06-27

## Decision

**GO for focused MVP implementation. NO-GO for customer beta.**

The backend can execute a deterministic signup-to-diagnostic-to-workflow-to-
agent-to-automation test. The browser does not yet expose that connected
journey, and the current dashboard is generated from synthetic demo data.

## Journey Baseline

| Stage | Current evidence | Certification |
| --- | --- | --- |
| Landing | Static landing assets and a Next.js command center | Not connected |
| Signup | Provider-backed identity runtime tests | No browser E2E |
| Organization | Membership and tenant authorization tests | No setup UX or deployed isolation proof |
| Business Profile | Service, repositories and tests | No customer form |
| Diagnostic | MRI, DNA and health services | No guided browser flow |
| Health Score | Deterministic health result and demo rendering | Not rendered from customer session |
| Top Problems | Constraint engine tests | Not connected to journey UI |
| Recommended Plan | Recommendation engine and roadmap tests | Not connected to approval UI |
| Approve | Workflow approval primitive | Test-controlled only |
| Workflow | Registered workflow execution | No recommendation-to-template instantiation |
| Agent | Governed internal-alpha execution | No production model/provider certification |
| Automation | Queue, worker, retry and durable adapter contracts | No deployed recovery evidence |
| Visible Result | Test report and synthetic command center | No customer-visible persisted outcome |

## TTFBV Instrumentation

`MvpJourneyTracker` defines thirteen ordered, idempotent stages. It records
organization, actor, business, trace, timestamp and metadata context through
an in-memory or PostgreSQL store.

The tracker:

- Rejects skipped or out-of-order stages.
- Treats repeated delivery of a completed stage as idempotent.
- Reports current and next stage.
- Calculates landing-to-first-value duration.
- Evaluates the initial twenty-minute target.
- Persists one event per journey and stage through migration `0009`.

The twelve-minute test is a deterministic contract test, not measured user
behavior. The production baseline remains **not measured** until the browser
journey emits all stages.

## Recommended Vertical Slice

1. Connect landing, browser authentication and organization bootstrap.
2. Build one accessible profile/MRI onboarding flow with resume.
3. Render health, five problems and recommendations from the authenticated
   tenant's data.
4. Let the owner approve one recommendation and instantiate one existing
   workflow template.
5. Execute one agent-assisted automation durably and render its result.
6. Persist notifications, audit and conversation history.
7. Run first-time-user E2E sessions and publish real TTFBV percentiles.

## Exit Criteria

- One fresh tenant completes all thirteen stages without test-only wiring.
- No stage uses synthetic business data.
- Refresh and process restart do not lose progress.
- Unauthorized and cross-tenant access fail closed.
- Automation failure is visible, recoverable and auditable.
- P50, P95 and completion-rate TTFBV metrics are reported from real sessions.

## Validation

- Typecheck: 21/21 tasks pass
- Lint: 21/21 tasks pass
- Tests: 64 executable assertions pass
- Production build: 11/11 tasks pass
- Migrations: `0001` through `0009` apply cleanly in an isolated local
  PostgreSQL schema
- Architecture: 164 modules and 438 dependencies analyzed with zero boundary
  violations
- Dead-code analysis: pass

These results certify the product measurement foundation. They do not certify
the customer journey or establish a real TTFBV baseline.
