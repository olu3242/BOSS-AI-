# BOSS — Release Candidate Roadmap
## From Architecture Complete to General Availability

**Date:** 2026-07-01
**Architecture Status:** FROZEN at MVP (Goal 22 complete)
**Backend Score:** 99/100

---

## Architecture Freeze

The BOSS core platform architecture is complete. No new engines, runtimes, or registries will be added unless a hard customer requirement forces it. Future development is convergence, polish, and customer value — not expansion.

**What is frozen:**
- 20 MCP intelligence modules
- 24 API services
- 64+ HTTP routes
- 36 registries
- Loop Runtime
- Durable Event Bus
- 17-table database schema
- Multi-tenant isolation model
- Organizational memory architecture

---

## Release Train

### RC1 — MVP Stabilization & Launch Readiness

**Theme:** Every customer reaches value in under 15 minutes.

**Phase A — Architecture Freeze (COMPLETE)**
- ✅ All Goals 1–22 complete
- ✅ 220/220 tests passing
- ✅ 0 TypeScript errors
- ✅ Architecture declared frozen

**Phase B — Customer Onboarding Experience**

| Milestone | Work Required |
|-----------|--------------|
| First login flow | Auth UI: sign up, sign in, email verify |
| Onboarding wizard | Guided flow: create business → MRI → first health score |
| Empty state design | Every page: actionable copy + CTA when no data exists |
| Progress indicators | Show where user is in 5-step onboarding funnel |
| First value moment | Auto-redirect to workspace after MRI completion |
| Mobile responsive | All workspace pages work on mobile |
| Error recovery | Clear error messages + retry actions on every page |

**Phase C — API & Infrastructure Hardening**

| Milestone | Work Required |
|-----------|--------------|
| Rate limiting | Per-org request throttling |
| Input validation | Zod schemas on all remaining unvalidated routes |
| Auth middleware | Production Supabase JWT validation (replace dev-token) |
| Database migrations | All 17 tables deployed to Supabase |
| Environment config | Doppler or Vercel env for all secrets |
| Health endpoint | `/health` returns full dependency status |
| Error monitoring | Sentry integration |
| Structured logging | Pino JSON logs to log aggregator |

**Phase D — Observability**

| Milestone | Work Required |
|-----------|--------------|
| OpenTelemetry traces | Instrument all API routes |
| PostHog events | Wire `workspace.view.loaded` + 4 other events |
| Performance baseline | P50/P95/P99 for all workspace API calls |
| Uptime monitoring | External health probe |

---

### RC2 — Customer Experience & Adoption

**Theme:** Every customer becomes an active user within 7 days.

**Phase A — Onboarding Completion Rate**
- Email sequence: welcome → first health score → first recommendation
- In-app nudges: "You have 3 pending approvals" notifications
- Progress persistence: resume onboarding after closing browser

**Phase B — UI Polish**
- Skeleton loaders on all workspace pages (not spinners)
- Optimistic UI for approval actions
- Real-time updates: workspace auto-refreshes when loop completes
- Mobile navigation: bottom nav bar on small screens
- Dark mode polish: consistent neutral palette across all pages

**Phase C — First Industry Packs**
- `general-smb` pack: already at v0.8.0 — promote to v1.0.0
- `hvac` pack: constraint library, KPI benchmarks, workflow templates
- `restaurant` pack: constraint library, KPI benchmarks, workflow templates
- `retail` pack: constraint library, KPI benchmarks, workflow templates

---

### RC3 — Marketplace, Integrations & AI Workforce

**Theme:** BOSS becomes a platform, not a product.

**Phase A — Marketplace**
- Industry pack browser: search, preview, install
- Pack versioning and upgrade flow
- Pack ratings and reviews (future)

**Phase B — Additional Industry Packs**
- Plumbing, Electrical, Cleaning, Home Care
- Dental, Legal, Accounting
- Landscaping, Coffee Shops

**Phase C — Ecosystem Integrations (adapters only)**
- Accounting: QuickBooks, Xero
- CRM: Salesforce, HubSpot
- Calendar: Google Calendar, Outlook
- Communication: Slack, Gmail, Twilio SMS
- Payments: Stripe
- Field service: ServiceTitan, Jobber
- Marketing: Mailchimp, ActiveCampaign

*All adapters implement the existing `ToolFabric` provider interface. Zero new business logic outside the integration layer.*

**Phase D — AI Workforce**

Finish 10 AI employees using the existing Decision OS and Operating Loop:

| AI Employee | Primary Capability Used |
|-------------|------------------------|
| Executive Assistant | Decision OS + Operating Loop |
| Sales Manager | Constraint Engine + Recommendation Engine |
| Operations Manager | KPI Derivation + Root Cause Engine |
| Finance Manager | Health Engine + Scenario Engine |
| Marketing Manager | Recommendation Engine + Planning Engine |
| Customer Success Manager | Constraint Engine + Verification Engine |
| HR Manager | Capability Engine + Decision OS |
| Dispatcher | Workflow Runtime + Scheduler |
| Scheduler | Loop Runtime + Calendar integrations |
| Compliance Officer | Audit Log + Policy Registry |

*All consume existing MCP intelligence — no new orchestration engines.*

---

### GA — General Availability

**Theme:** Production-grade, enterprise-ready.

**Security Hardening**
- Penetration testing
- OWASP Top 10 audit
- Row-level security on all Supabase tables
- Secret rotation procedures

**Performance**
- Load testing: 1,000 concurrent users
- Database query optimization
- CDN for static assets
- Edge caching for workspace snapshots

**Disaster Recovery**
- Automated database backups (hourly, daily, weekly)
- Cross-region failover plan
- RTO < 1 hour, RPO < 15 minutes

**Deployment Automation**
- CI/CD pipeline: test → typecheck → build → deploy
- Blue/green deployments
- Automated rollback on health check failure

**Documentation**
- API reference (auto-generated from types)
- Integration guide for industry pack authors
- Admin guide for enterprise deployments

**Customer Support**
- In-app help center
- Support ticket integration
- SLA tracking dashboard

---

## Success Metrics

| Release | Primary KPI | Target |
|---------|-------------|--------|
| RC1 | Time to first value | < 15 minutes |
| RC2 | Day-7 retention | > 60% |
| RC3 | Integrations connected per business | > 2 |
| GA | Uptime | > 99.9% |

---

## What Does NOT Change

The following architectural decisions are permanent and will not be revisited:

1. **MCP owns all intelligence.** Every business insight, recommendation, and plan flows through `packages/mcp/src/intelligence/`. Never in Loop, never in frontend.

2. **Registry-first.** Every industry-specific configuration lives in a registry entry. Never hardcoded.

3. **Multi-tenant from day one.** Every database table has `org_id`. Every API route extracts `orgId` from JWT.

4. **Event-sourced.** Every state change emits a domain event. The audit trail is immutable.

5. **Declarative workflows.** No imperative orchestration in the Loop Runtime. Everything is a workflow definition.

These five decisions will support a company worth billions. Do not compromise them.
