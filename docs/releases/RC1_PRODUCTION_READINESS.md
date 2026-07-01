# RC1 Production Readiness

Date: 2026-07-01

Baseline: `72c35fa52692b7eb81688852f9f5a48460ec5521`

## Readiness matrix

| Area | Code verification | Deployment verification |
| --- | --- | --- |
| Environment variables | Requirements documented and validated in code | **Blocked:** no production values available |
| Secrets | No secrets committed; environment/vault adapters tested | **Blocked:** no durable production KMS/secret store verified |
| Database migrations | Sequential `0001`–`0023`; RLS convention tests pass | **Blocked:** no live staging/production migration run |
| Scheduler/background jobs | Cron, recovery, leasing, and dead-letter tests pass | External trigger and worker identities must be configured |
| Event replay | Durable log, tenant isolation, and replay queries tested | Cross-process replay must be exercised with the live database |
| Telemetry/logging | Health, counters, tracing, and structured logging tested | Monitoring sink and alert routing must be configured |
| Health endpoint | Unauthenticated health endpoint tests pass | Deployment probe must be registered |
| Feature flags | `BOSS_FLAG_*` behavior tested | Production values must be approved |
| Support services | Support, feedback, analytics, and customer-health flows pass | Email/support destinations must be configured |

## Human-operated release gates

1. Supply and validate non-empty production Supabase, database, callback,
   encryption, provider, and monitoring secrets through the deployment
   platform.
2. Apply migrations `0001`–`0023` to staging, verify RLS with non-privileged
   tenant roles, and run the integration suite against that database.
3. Configure a durable external secret manager for customer integration
   credentials and prove rotation/restart behavior.
4. Configure the scheduler trigger, worker identities, health probes, telemetry
   sink, alerts, and support destinations; then run a staging smoke.

## Verdict

**NO-GO for production deployment.** This is an external configuration and
infrastructure gate, not a failing source-code gate. The `v1.0.0-rc1` tag must
not be created until all four gates are evidenced.
