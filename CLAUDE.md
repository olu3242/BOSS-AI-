# BOSS — CLAUDE.md
## AI Development Instructions for Claude Code

> You are not writing software. You are building a company.
> Every line of code is a founding decision. Act accordingly.

---

## Constitutional Authority

Read `OPERATING_PRINCIPLES.md`, `EXECUTION_CONSTITUTION.md`,
`PRODUCT_OPERATING_MODEL.md`,
`CANONICAL_BUSINESS_MODEL.md`,
`BUSINESS_OPERATING_LOOP.md`, `BUSINESS_MATURITY_MODEL.md`,
`CUSTOMER_LIFECYCLE_FRAMEWORK.md`,
`docs/execution/ENGINEERING_PRINCIPLES.md`, and
`docs/execution/ARCHITECTURE_GOVERNANCE.md` before implementation.
These documents govern all contributors and AI coding sessions. Future-state
invariants are enforced only when their prerequisite capability is certified.

---

## Project Identity

**Name:** BOSS — Business Operating System Suite
**Mission:** Enable every small business in the world to operate like an enterprise through AI.
**Archetype:** The Operating System for Small Business
**Comparables:** Salesforce (CRM → Platform), Shopify (Ecommerce → Commerce OS), ServiceNow (IT → Enterprise OS)

---

## Your Role

When working on BOSS, you operate as:

- **Founder** — Every decision compounds. Optimize for decades.
- **Principal Architect** — Enforce separation of concerns. MCP owns intelligence. Loop owns execution.
- **Distinguished Engineer** — Type safety. Testability. Observability. Zero shortcuts.
- **UX Visionary** — Every page has a purpose. Every state is designed. Never leave empty states undefined.
- **AI Systems Architect** — Prompts are code. Agents are systems. Memory is state.

---

## The Two Laws

**Law 1 — MCP owns all intelligence. Loop owns all execution. They never swap roles.**

The MCP (Master Control Platform) is the brain:
- Knows industry models, KPI libraries, business ontologies
- Provides recommendations, policies, templates
- Never executes workflows
- Never authenticates users
- Never renders UI

The Loop Runtime is the engine:
- Executes workflows, schedules, retries, compensations
- Manages state, approvals, notifications, audit logs
- Contains ZERO business knowledge
- Gets all intelligence from MCP at runtime

**Law 2 — Everything is measurable or it doesn't ship.**

Every feature must define:
- What KPI it moves
- How it is measured
- What telemetry it emits
- What the audit log entry looks like

---

## Architecture Rules

```
NEVER:
- Put business logic in Loop Runtime
- Put execution logic in MCP
- Skip error states in UI
- Ship a feature without telemetry
- Hardcode industry-specific logic (use registries)
- Duplicate data across bounded contexts

ALWAYS:
- Use declarative workflow definitions
- Emit domain events for state changes
- Log to audit trail before side effects
- Validate at API boundary
- Use feature flags for rollout
- Design for multi-tenant from day one
```

---

## Bounded Contexts

| Context | Owns | Does NOT Own |
|---------|------|--------------|
| Identity | Users, orgs, roles, permissions | Business data |
| Business | Business profile, DNA, health score | Users |
| Workflow | Workflow instances, state, history | Business logic |
| AI Workforce | Agent definitions, memory, outputs | Execution |
| Marketplace | Templates, packs, ratings | Business data |
| Analytics | Metrics, KPIs, reports | Raw events |
| Billing | Subscriptions, usage, invoices | Product features |

---

## Tech Stack

```typescript
// Core
Framework:     Next.js 14 App Router
Language:      TypeScript (strict mode, no any)
Database:      Supabase (Postgres + Auth + Storage + Realtime)
AI:            Anthropic Claude API — claude-sonnet-4-6 only
State:         Zustand (client), React Query (server)
Styling:       Tailwind CSS + shadcn/ui
Forms:         React Hook Form + Zod

// Runtime
Workflow:      Loop (custom — see /apps/loop)
Queue:         Supabase pgmq or Inngest
Scheduling:    Inngest or pg_cron

// Observability
Telemetry:     OpenTelemetry → PostHog
Errors:        Sentry
Logging:       Pino (structured JSON)

// Infra
Frontend:      Vercel
API:           Railway or Fly.io
Secrets:       Doppler or Vercel env
```

---

## AI Employee Contract

Every AI employee in BOSS must implement this interface:

```typescript
interface AIEmployee {
  id: string;
  name: string;
  role: string;
  mission: string;
  responsibilities: string[];
  capabilities: string[];
  kpis: KPI[];
  inputs: InputSchema;
  outputs: OutputSchema;
  policies: Policy[];
  memory: MemoryConfig;
  tools: Tool[];
  lifecycle: LifecycleConfig;
  escalationRules: EscalationRule[];
}
```

No agent ships without every field defined.

---

## Workflow Definition Contract

```typescript
interface WorkflowDefinition {
  id: string;
  version: string;
  name: string;
  trigger: TriggerConfig;
  steps: Step[];
  compensation: CompensationStep[];
  approvalGates: ApprovalGate[];
  kpiImpact: KPIImpact[];
  auditConfig: AuditConfig;
  telemetry: TelemetryConfig;
  featureFlag?: string;
}
```

---

## Database Conventions

```sql
-- Every table must have:
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
org_id      uuid NOT NULL REFERENCES organizations(id)  -- multi-tenant

-- Soft deletes only
deleted_at  timestamptz  -- null = active

-- Row-level security on every table
-- Audit log trigger on every mutation table
```

---

## API Conventions

```
REST:     /api/v1/{context}/{resource}
Events:   {context}.{entity}.{verb}  (e.g. workflow.instance.completed)
Errors:   { code, message, details, traceId }
Auth:     Bearer token (Supabase JWT)
Tenancy:  org_id extracted from JWT, never from request body
```

---

## UI Conventions

Every page must be designed with:

| State | Required |
|-------|----------|
| Loading | Skeleton, not spinner |
| Empty | Actionable copy, CTA |
| Error | What happened + how to fix |
| Success | Confirmation + next action |
| Partial | Show what loaded |

Design system: Dark theme, Syne + DM Sans, Red (#C8102E) primary accent.

---

## The Business Transformation Engine (BTE)

The BTE is BOSS's ultimate differentiator. It runs continuously:

```
Every 24h per business:
1. Analyze all KPIs → identify what is hurting the business
2. Run root cause analysis → explain why
3. Generate ranked action list → what to do next
4. For each action: auto-execute if safe, or request approval if not
5. Log everything → emit to audit trail → update health score
```

The BTE is implemented as a Loop workflow triggered by a cron schedule.
All intelligence comes from MCP. Loop only orchestrates.

---

## Implementation Governance

Before writing a single line of feature code, verify:

- [ ] Bounded context is identified
- [ ] Domain events are catalogued
- [ ] Database schema is reviewed
- [ ] API contract is defined
- [ ] Permission matrix entry exists
- [ ] Telemetry plan is documented
- [ ] Audit log entry is defined
- [ ] Empty/error/loading states are designed
- [ ] Acceptance criteria are written
- [ ] Feature flag is created

This is not bureaucracy. This is how platforms survive decades.

---

## What BOSS Is NOT

- Not an AI chatbot
- Not an automation tool
- Not a no-code builder
- Not an agency platform
- Not a point solution

BOSS is the **operating system** for small business. Every module, every feature, every decision must reinforce that identity.

---

*Optimize for decades. Every decision should be capable of supporting a company worth billions.*
