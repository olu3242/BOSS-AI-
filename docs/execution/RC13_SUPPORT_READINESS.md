# RC1.3 — Support Readiness
## Customer Support, Diagnostics & Operational Playbook

**Date:** 2026-07-01

---

## Current State

BOSS has no customer-facing support infrastructure. There is no in-app help, no way to report a problem, no diagnostic ID surfaced to users, and no support contact visible.

This document defines what is required and what is being built in RC1.3.

---

## In-App Support Entry Points (RC1.3 Implementation)

### 1. Help Footer in Workspace Layout

Every workspace page will include a footer with:
- Link to documentation (placeholder URL)
- "Report a problem" link → opens feedback form
- BOSS version tag (`v0.9.0-rc1`)
- Support email

### 2. Diagnostic ID

Every error state in the application will display a `traceId` that users can share with support. The API already returns `traceId` in all error responses. The frontend will surface it.

### 3. Report a Problem Form

A modal form captured directly in the workspace that POSTs to a support endpoint, recording:
- User message
- Business ID
- Current page URL
- Timestamp
- Platform version

### 4. Health Status Page

`/status` — public page showing:
- API uptime status
- Recent incidents (manually updated)
- Current platform version

---

## Support Tiers

| Tier | Trigger | Response SLA | Channel |
|------|---------|-------------|---------|
| P1 — Critical | Platform down, data loss | 1 hour | Email + Slack |
| P2 — High | Feature broken for multiple customers | 4 hours | Email |
| P3 — Medium | Feature degraded, workaround exists | 24 hours | Email |
| P4 — Low | Question, feature request | 72 hours | Email |

---

## Incident Response Playbook

### When to declare an incident

- `httpErrors` counter spikes above 5% of requests in 5 minutes
- `GET /health` returns non-200 for 2 consecutive probes
- Circuit breaker opens on any provider for > 10 minutes
- Customer reports data is wrong or missing

### Incident steps

1. **Detect** — Uptime monitor fires alert OR customer reports via "Report a problem"
2. **Triage** — Check `GET /metrics` for error spike; check event log for correlating events
3. **Identify** — Use `traceId` from customer report to find the failing request in logs
4. **Resolve** — Fix or rollback (Vercel: instant via dashboard)
5. **Communicate** — Update `/status` page; email affected customers
6. **Post-mortem** — Document root cause + prevention in `docs/incidents/`

---

## Diagnostic Tools

| Tool | How to Access | What It Shows |
|------|---------------|---------------|
| `GET /api/v1/metrics` | Internal, requires Bearer token | HTTP counters, latencies, uptime, memory |
| `GET /api/v1/businesses/:id/timeline` | Admin Bearer token | All events for a business |
| Event log | Direct Supabase query | Every domain event ever emitted |
| `x-trace-id` response header | Every API response | Unique request identifier |

---

## Known Limitations at RC1.3

1. **No auth** — Customers cannot actually log in. Dev-only bypass active.
2. **No structured logs** — Errors must be found via Supabase logs or `console.log`.
3. **No Sentry** — No automatic error grouping or alerting.
4. **No external uptime monitor** — Must be configured manually.
5. **No in-app feedback UI** — Built in RC1.3 workstream 4.

---

## Beta Support Protocol

For the first 25 customers:
1. Each customer is assigned a dedicated Slack channel
2. Every "Report a problem" submission is triaged within 2 hours
3. Weekly check-in call to review business health score
4. Customers invited to provide structured feedback via RC1.4 feedback form

---

## Version Information

| Component | Version | Notes |
|-----------|---------|-------|
| Platform | v0.9.0-rc1 | Architecture frozen at Goal 22 |
| general-smb industry pack | v0.8.0 | Seeded on startup |
| API routes | 66 | See `server.ts` |
| MCP intelligence modules | 20 | Frozen |
| Database tables | 17 | All in `packages/db/migrations/` |
