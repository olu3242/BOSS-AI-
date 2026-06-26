# BOSS — Business Operating System Suite

> **Enable every small business in the world to operate like an enterprise through AI.**

BOSS is not software. BOSS is a platform company.

The same way Salesforce became more than CRM, and Shopify became more than ecommerce — BOSS becomes the **Operating System for Small Business**.

---

## What BOSS Is

BOSS is a category-defining AI platform that gives every small business a **digital COO** — a living, learning system that continuously answers four questions:

1. **What is hurting the business?**
2. **Why is it happening?**
3. **What should be done next?**
4. **Can BOSS safely do it automatically, or should it ask for approval?**

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BOSS Platform                        │
├────────────────────┬────────────────────────────────────┤
│   MCP (Brain)      │     Loop Runtime (Execution)       │
│  ─────────────     │     ─────────────────────────      │
│  Knowledge         │     Workflow Engine                │
│  Policies          │     Decision Engine                │
│  Templates         │     Scheduling Engine              │
│  KPI Library       │     Approval Engine                │
│  Prompt Registry   │     Notification Engine            │
│  Industry Models   │     Recovery Engine                │
│  Recommendations   │     Audit Logs                    │
└────────────────────┴────────────────────────────────────┘
```

**MCP (Master Control Platform)** = The Brain. Owns all intelligence. Never executes.
**Loop Runtime** = The Engine. Executes everything. Contains zero business knowledge.

---

## Fable 5 Methodology

BOSS is designed through five foundational layers:

| Fable | Layer | Purpose |
|-------|-------|---------|
| **1** | Foundation | Business ontology, personas, lifecycle |
| **2** | Architecture | Bounded contexts, domain model, registries |
| **3** | Product | Every user experience and page |
| **4** | Execution | Loop Runtime, engines, observability |
| **5** | Evolution | Marketplace, SDK, partner platform |

---

## MVP Success Criteria

A business owner can:

- [ ] Create an account
- [ ] Create a business
- [ ] Complete an AI audit
- [ ] Receive a Business Health Score
- [ ] Receive a Transformation Report
- [ ] Deploy one AI workflow
- [ ] Deploy one AI employee
- [ ] Measure one KPI improvement
- [ ] Calculate ROI

---

## AI Workforce

BOSS ships with reusable AI employees:

- **CEO Advisor** — Strategic alignment and decision support
- **COO** — Operational efficiency and execution oversight
- **Sales Manager** — Pipeline management and revenue optimization
- **Marketing Director** — Campaign management and growth
- **Receptionist** — Inbound communications and scheduling
- **Bookkeeper** — Financial tracking and reporting
- **HR Coordinator** — People operations and compliance
- **Customer Success Manager** — Retention and satisfaction
- **Scheduler** — Appointment and resource management
- **Collections Specialist** — AR management and follow-up
- **Review Manager** — Reputation management
- **Proposal Writer** — Sales document generation
- **Reporting Analyst** — Business intelligence and insights

---

## Business Model

| Stream | Description |
|--------|-------------|
| Subscription | Tiered SaaS per seat/location |
| Marketplace | Template and workflow revenue share |
| Partner | Consultant and reseller licensing |
| Enterprise | DSO/franchise licensing |
| Usage | Token budget metering |

---

## Tech Stack

```
Frontend     Next.js 14 App Router, TypeScript, Tailwind CSS
Backend      Node.js, Supabase (Postgres + Auth + Storage)
AI Layer     Anthropic Claude API (claude-sonnet-4-6)
Runtime      Loop (custom event-driven workflow engine)
Brain        MCP (knowledge graph + policy engine)
Infra        Vercel (frontend), Railway/Fly.io (runtime)
Observability OpenTelemetry, PostHog
```

---

## Directory Structure

```
boss/
├── CLAUDE.md                    # AI development instructions
├── README.md                    # This file
├── package.json                 # Monorepo root
├── product-architecture/        # All design artifacts
│   ├── 00-constitution.md       # The BOSS Constitution
│   ├── 01-product-contract.md   # MVP & acceptance criteria
│   ├── 02-fable-1-foundation.md
│   ├── 03-fable-2-architecture.md
│   ├── 04-fable-3-product.md
│   ├── 05-fable-4-execution.md
│   ├── 06-fable-5-evolution.md
│   ├── 07-domain-model.md
│   ├── 08-event-catalog.md
│   ├── 09-api-contracts.md
│   ├── 10-security-model.md
│   ├── 11-permission-matrix.md
│   └── 12-implementation-waves.md
├── skills/
│   └── BOSS-SKILL.md            # Claude Code skill for BOSS
├── apps/
│   ├── web/                     # Next.js frontend
│   ├── api/                     # Backend API
│   └── loop/                    # Loop Runtime
└── packages/
    ├── mcp/                     # Master Control Platform
    ├── ui/                      # Shared component library
    ├── types/                   # Shared TypeScript types
    └── config/                  # Shared configuration
```

---

## Implementation Waves

**Wave 0** — Foundation (Weeks 1–2): Constitution, contracts, domain model, database schema
**Wave 1** — Core Platform (Weeks 3–6): Auth, business onboarding, AI audit, health score
**Wave 2** — AI Workforce (Weeks 7–10): First 3 AI employees, workflow deployment
**Wave 3** — Marketplace (Weeks 11–14): Template marketplace, partner portal
**Wave 4** — Evolution (Weeks 15+): SDK, industry packs, enterprise licensing

---

## Governance

No code ships without:
- Internally consistent architecture artifacts
- Passing acceptance criteria
- Telemetry instrumented
- Audit log entry defined
- Security model reviewed

---

*BOSS is not a tool. BOSS is a transformation.*
