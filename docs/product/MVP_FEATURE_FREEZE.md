# BOSS MVP Feature Freeze

Date: 2026-06-27

## Product Promise

**BOSS finds problems in a business, builds a plan, and starts fixing them
automatically.**

The MVP is one connected experience:

```text
Landing -> Signup -> Organization -> Business Profile -> Diagnostic
-> Health Score -> Top Problems -> Recommended Plan -> Approval
-> Workflow -> Agent -> Automation -> Visible Result
```

No feature is complete merely because its service, registry, or screen exists.
It is complete when a first-time customer can use it in this journey with
persistent data, tenant enforcement, recovery, and visible success or failure.

## North Star

**Time to First Business Value (TTFBV)**

- Internal target: under 20 minutes
- Stretch target: under 10 minutes
- Long-term target: under 5 minutes

TTFBV begins at `landing_viewed` and ends at `first_value_visible`. Synthetic
tests validate the metric contract but do not establish a customer baseline.

## P0: Must Have

| Capability | Current status | MVP completion condition |
| --- | --- | --- |
| Landing Page | Partial | Clear entry into a measured signup journey |
| Authentication | Partial | Browser signup, verification, login, refresh, expiry and logout pass E2E |
| Organization Setup | Partial | Owner creates/selects an isolated organization in-browser |
| Business Profile | Backend functional | Accessible onboarding form persists a tenant-scoped profile |
| Business Diagnostic | Backend functional | Guided MRI can resume and complete with validation |
| Business Health Score | Backend functional | Real customer result is rendered with explanation |
| Core Intelligence | Backend functional | Diagnostic, DNA, health and constraints execute from submitted data |
| Recommendations | Backend functional | Top five ranked problems and recommendations are visible and traceable |
| Dashboard | Demo only | Live journey state, progress and first result replace synthetic snapshot |
| Workflow Generation | Missing | Approved recommendation instantiates a registered workflow template |
| Agent Execution | Internal alpha | Approved workflow invokes a governed agent with durable history |
| Automation Execution | Internal alpha | Durable worker completes one useful automation with recovery |
| Notifications | Missing | Customer receives in-app success/failure notification |
| Persistent Data | Partial | Journey survives restart against migrated PostgreSQL with RLS tests |
| Audit Trail | Partial | Security and consequential business actions are durably queryable |
| AI Conversation History | Missing | Tenant-scoped conversations persist with provenance and retention controls |

## P1: Should Have

- Executive Summary
- Knowledge Base
- AI Memory
- Team Management
- Task Management
- Search
- Reports
- Email Templates
- Basic Integrations

P1 work may begin only when it directly removes a measured P0 journey blocker.

## P2: Post MVP

- Marketplace
- SDK
- Plugin Platform
- Public APIs
- Additional Industry Packs
- Enterprise Governance Expansion
- Global Scale
- Multi-region
- FinOps
- Fleet Management
- Partner Platform
- White Label

No P2 implementation begins until every P0 row demonstrates the same
tenant-scoped end-to-end customer journey.

## Change Control

A proposed feature must answer both questions:

1. Which P0 journey stage does it complete or materially improve?
2. How will it reduce TTFBV or improve the safety and quality of the result?

Without concrete answers, the feature moves to backlog. Frozen architecture
changes additionally require a new ADR under ADR-0006.
