---
name: boss-platform
description: >
  Use this skill when working on any part of the BOSS (Business Operating System Suite) platform.
  Triggers: any file in /apps/web, /apps/api, /apps/loop, /packages/mcp, or any reference to
  BOSS modules (AI Workforce, Loop Runtime, MCP, BTE, business health score, workflow engine).
  Also use when implementing AI employees, defining workflow contracts, or designing bounded contexts.
---

# BOSS Platform Skill

## Identity

BOSS is not software. BOSS is a platform company — the Operating System for Small Business.
The strategic comparables are Salesforce, Shopify, and ServiceNow.
Every implementation decision must be capable of supporting a company worth billions.

## The Two Laws (NEVER VIOLATE)

**Law 1:** MCP owns intelligence. Loop owns execution. Never swap.
- MCP: knowledge, policies, templates, KPI library, recommendations — no execution
- Loop: workflow engine, scheduling, retries, audit logs — no business knowledge

**Law 2:** Everything measurable or it doesn't ship.
- Every feature must define the KPI it moves
- Every feature must emit telemetry
- Every feature must have an audit log entry

## Critical Architecture Patterns

### Multi-Tenancy (Always-On)
```typescript
// org_id ALWAYS from JWT, never from request body
const orgId = req.user.org_id; // ✅
const orgId = req.body.org_id; // ❌ NEVER
```

### Bounded Context Enforcement
```typescript
// Identity context does NOT import from Business context
// Business context does NOT import from Workflow context (only via events)
// Cross-context communication = domain events only
```

### AI Employee Pattern
```typescript
// All AI employees must implement AIEmployee interface
// Memory is scoped per employee per business (never cross-contaminate)
// Escalation rules must be defined before deployment
// Token budget must be set (never unbounded)
```

### Workflow Definition (Declarative Only)
```typescript
// Workflows are data, not code
// No imperative workflow logic in Loop Runtime
// All business rules come from MCP at runtime via policy lookup
```

## Database Rules

```sql
-- Every table: id (uuid), created_at, updated_at, org_id, deleted_at
-- Soft deletes only — never hard delete business data
-- RLS on every table — no exceptions
-- Audit trigger on every mutation table
-- Indexes on: org_id, created_at, status columns
```

## API Rules

```
Pattern:  /api/v1/{bounded-context}/{resource}
Events:   {context}.{entity}.{verb}
Errors:   { code, message, details, traceId }
Auth:     Supabase JWT Bearer
Version:  Always v1 prefix, plan for v2 from day one
```

## UI Rules

- Design system: Dark theme (#0A0A0B background)
- Typography: Syne (display/headings) + DM Sans (body)
- Primary accent: #C8102E (BOSS Red)
- Secondary accent: #FF6B35 (energy/action)
- Every page: loading skeleton, empty state with CTA, error with recovery action
- No spinners — use skeleton loaders
- Mobile-first, responsive to desktop

## Business Transformation Engine (BTE)

The BTE is BOSS's core differentiator. Runs every 24h per business.
```
Analyze KPIs → identify pain → root cause → ranked actions → auto-execute or request approval
```
Implementation: Loop cron workflow + MCP intelligence lookups.
Never hardcode business logic in Loop — always fetch from MCP policy registry.

## AI Model

Always use: `claude-sonnet-4-6`
Max tokens: 4096 for analysis tasks, 1024 for structured outputs
Temperature: 0 for structured outputs, 0.3 for advisory content
Always stream for user-facing AI responses (perceived performance)

## Supabase Patterns

```typescript
// Server-side: always use service role key
// Client-side: always use anon key with RLS
// Realtime: use for live dashboard updates (workflow status, notifications)
// Storage: business documents, workflow artifacts, AI employee outputs
```

## Feature Flags

Every new feature behind a flag using Vercel Edge Config or PostHog.
Flag naming: `boss-{context}-{feature}` (e.g., `boss-workforce-ceo-advisor`)

## Testing Requirements

Unit tests: Domain logic, workflow definitions, policy evaluations
Integration tests: API endpoints, database operations
E2E tests: Core MVP user journeys (onboarding, audit, deploy workflow)
Load tests: Loop Runtime under concurrent workflow execution

## Implementation Waves Reference

| Wave | Focus | Do NOT start Wave N+1 without Wave N passing acceptance |
|------|-------|------|
| 0 | Constitution, contracts, schema | Foundation artifacts complete |
| 1 | Auth, onboarding, audit, health score | MVP criteria 1-5 passing |
| 2 | AI Workforce, workflow deployment | MVP criteria 6-9 passing |
| 3 | Marketplace, partner portal | Wave 2 stable for 2 weeks |
| 4 | SDK, industry packs, enterprise | Wave 3 monetizing |

## What BOSS Is NOT

Never build BOSS as:
- An AI chatbot interface
- A drag-and-drop automation builder
- An agency platform
- A point solution (e.g., "just scheduling" or "just CRM")

BOSS is always the OS layer — the platform other things are built on.
