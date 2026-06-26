# BOSS Platform Architecture
## Product Architecture Document v0.1

---

## 1. System Overview

```
╔══════════════════════════════════════════════════════════════════════╗
║                         BOSS PLATFORM                               ║
║                  Business Operating System Suite                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │                    CLIENT LAYER                             │    ║
║  │  Web App (Next.js)  │  Mobile (React Native)  │  Embed SDK │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │                    API GATEWAY                              │    ║
║  │    Auth Middleware  │  Rate Limiting  │  Tenant Isolation   │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                    │                    │                            ║
║  ┌─────────────────┐    ┌───────────────────────────────────────┐   ║
║  │  MCP (BRAIN)    │    │         LOOP RUNTIME (ENGINE)         │   ║
║  │─────────────────│    │───────────────────────────────────────│   ║
║  │ Knowledge Graph │    │ Workflow Engine   │ Decision Engine   │   ║
║  │ Policy Registry │    │ Scheduling Engine │ Approval Engine   │   ║
║  │ KPI Library     │◄───│ Notification Eng  │ Recovery Engine   │   ║
║  │ Prompt Registry │    │ Execution Engine  │ Audit Engine      │   ║
║  │ Industry Models │    │ State Manager     │ Telemetry Engine  │   ║
║  │ Recommendations │    └───────────────────────────────────────┘   ║
║  └─────────────────┘                    │                           ║
║                              │          │                            ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │                   DATA LAYER                                │    ║
║  │  Supabase Postgres  │  Vector Store  │  Time-Series Store   │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
║                              │                                       ║
║  ┌─────────────────────────────────────────────────────────────┐    ║
║  │               EXTERNAL INTEGRATIONS                         │    ║
║  │  Anthropic Claude  │  Stripe  │  Twilio  │  Gmail  │  More  │    ║
║  └─────────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## 2. Bounded Contexts

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BOUNDED CONTEXTS                             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   IDENTITY   │  │   BUSINESS   │  │   WORKFLOW   │             │
│  │              │  │              │  │              │             │
│  │ Users        │  │ Profile      │  │ Definitions  │             │
│  │ Orgs         │  │ Business DNA │  │ Instances    │             │
│  │ Roles        │  │ Health Score │  │ State        │             │
│  │ Permissions  │  │ Audit Data   │  │ History      │             │
│  │ Sessions     │  │ KPI Tracking │  │ Approvals    │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  AI WORKFORCE│  │ MARKETPLACE  │  │  ANALYTICS   │             │
│  │              │  │              │  │              │             │
│  │ Agent Defs   │  │ Templates    │  │ Metrics      │             │
│  │ Instances    │  │ Industry Pks │  │ KPI Dashboard│             │
│  │ Memory       │  │ Reviews      │  │ Reports      │             │
│  │ Outputs      │  │ Licensing    │  │ Forecasts    │             │
│  │ Escalations  │  │ Revenue Share│  │ BTE Output   │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐                               │
│  │   BILLING    │  │    PARTNER   │                               │
│  │              │  │              │                               │
│  │ Subscriptions│  │ Consultants  │                               │
│  │ Usage        │  │ Resellers    │                               │
│  │ Invoices     │  │ Referrals    │                               │
│  │ Token Budget │  │ Commissions  │                               │
│  └──────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. MCP Architecture (The Brain)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MASTER CONTROL PLATFORM (MCP)                    │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    KNOWLEDGE LAYER                          │   │
│  │  Business Ontology │ Industry Models │ KPI Definitions      │   │
│  │  Constraint Graph  │ Capability Model │ Success Metrics     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌───────────────────┐  │
│  │  PROMPT REGISTRY │ │ WORKFLOW REGISTRY │ │  POLICY REGISTRY  │  │
│  │                  │ │                  │ │                   │  │
│  │ System prompts   │ │ Workflow defs     │ │ Business rules    │  │
│  │ Industry prompts │ │ Trigger configs  │ │ Compliance rules  │  │
│  │ Agent prompts    │ │ Step templates   │ │ Approval policies │  │
│  │ Analysis prompts │ │ Compensations    │ │ Escalation rules  │  │
│  └──────────────────┘ └──────────────────┘ └───────────────────┘  │
│                                                                     │
│  ┌──────────────────┐ ┌──────────────────┐ ┌───────────────────┐  │
│  │  AGENT REGISTRY  │ │ MEMORY REGISTRY  │ │ INDUSTRY REGISTRY │  │
│  │                  │ │                  │ │                   │  │
│  │ AI employee defs │ │ Long-term memory │ │ Dental            │  │
│  │ Capability maps  │ │ Context windows  │ │ Legal             │  │
│  │ Tool manifests   │ │ Learning records │ │ Real Estate       │  │
│  │ KPI contracts    │ │ Business context │ │ Home Services     │  │
│  └──────────────────┘ └──────────────────┘ └───────────────────┘  │
│                                                                     │
│  INPUT: Business context, event data, query requests               │
│  OUTPUT: Recommendations, policies, templates, analysis            │
│  NEVER: Executes workflows, authenticates users, renders UI        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Loop Runtime Architecture (The Engine)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOOP RUNTIME                                │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                      TRIGGER LAYER                            │  │
│  │  Webhook  │  Cron Schedule  │  Event Bus  │  API Call        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  WORKFLOW   │  │  SCHEDULING  │  │   APPROVAL   │             │
│  │  ENGINE     │  │  ENGINE      │  │   ENGINE     │             │
│  │             │  │              │  │              │             │
│  │ Step exec   │  │ Cron mgmt    │  │ Gate mgmt    │             │
│  │ State mgmt  │  │ Delay mgmt   │  │ Notifications│             │
│  │ Branching   │  │ Recurring    │  │ Escalation   │             │
│  │ Parallel    │  │ Backfill     │  │ Auto-approve │             │
│  └─────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  RECOVERY   │  │ NOTIFICATION │  │  AUDIT LOG   │             │
│  │  ENGINE     │  │  ENGINE      │  │  ENGINE      │             │
│  │             │  │              │  │              │             │
│  │ Retry logic │  │ Email        │  │ Immutable log│             │
│  │ Dead letter │  │ SMS          │  │ Event source │             │
│  │ Compensation│  │ In-app       │  │ Compliance   │             │
│  │ Idempotency │  │ Webhook      │  │ Export       │             │
│  └─────────────┘  └──────────────┘  └──────────────┘             │
│                                                                     │
│  BUSINESS KNOWLEDGE: Loop contains ZERO. Always fetched from MCP.  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Business Transformation Engine (BTE)

```
┌─────────────────────────────────────────────────────────────────────┐
│              BUSINESS TRANSFORMATION ENGINE (BTE)                   │
│                    Runs every 24h per business                      │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │  CRON TRIGGER│                                                   │
│  │  (Loop)      │                                                   │
│  └──────┬───────┘                                                   │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STEP 1: KPI ANALYSIS (MCP)                                  │  │
│  │  "What is hurting this business right now?"                  │  │
│  │  → Fetch all KPIs → Identify anomalies → Rank by impact     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STEP 2: ROOT CAUSE ANALYSIS (MCP)                           │  │
│  │  "Why is it happening?"                                      │  │
│  │  → Cross-reference business events → Apply causal model      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STEP 3: ACTION GENERATION (MCP + Claude API)                │  │
│  │  "What should be done next?"                                 │  │
│  │  → Generate ranked action list → Estimate ROI per action     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STEP 4: EXECUTION DECISION (Loop + Policy Registry)         │  │
│  │  "Can BOSS safely do it, or should it ask?"                  │  │
│  │  Safe to auto-execute? → Execute via Loop                    │  │
│  │  Needs approval? → Notify owner → Wait for approval gate     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│         │                                                           │
│         ▼                                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  STEP 5: UPDATE (Loop → Analytics Context)                   │  │
│  │  → Update Business Health Score                              │  │
│  │  → Append to Transformation Report                           │  │
│  │  → Emit audit log entry                                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Database Schema (Core Tables)

```sql
-- IDENTITY CONTEXT
organizations (id, name, slug, plan, status, created_at)
users (id, org_id, email, role, status, created_at)
permissions (id, role, resource, action, conditions)

-- BUSINESS CONTEXT
businesses (id, org_id, name, industry, employee_count, annual_revenue)
business_dna (id, business_id, strengths, weaknesses, goals, constraints)
health_scores (id, business_id, score, components, calculated_at)
ai_audits (id, business_id, responses, analysis, report, completed_at)

-- WORKFLOW CONTEXT
workflow_definitions (id, org_id, name, version, trigger, steps, status)
workflow_instances (id, definition_id, business_id, state, started_at, completed_at)
workflow_steps (id, instance_id, step_name, status, input, output, executed_at)
approval_requests (id, instance_id, step_id, requested_by, approved_by, status)

-- AI WORKFORCE CONTEXT
agent_definitions (id, org_id, role, mission, capabilities, policies, tools)
agent_instances (id, definition_id, business_id, status, deployed_at)
agent_memory (id, agent_instance_id, key, value, expires_at)
agent_outputs (id, agent_instance_id, type, content, kpi_impact, created_at)

-- ANALYTICS CONTEXT
kpi_values (id, business_id, kpi_key, value, period_start, period_end)
transformation_events (id, business_id, type, description, impact, created_at)
bte_reports (id, business_id, pains, causes, actions, executed, created_at)

-- BILLING CONTEXT
subscriptions (id, org_id, plan, status, trial_ends_at, renews_at)
usage_records (id, org_id, metric, quantity, period_start, period_end)
token_budgets (id, org_id, monthly_limit, used, resets_at)
```

---

## 7. Implementation Waves

```
WAVE 0 — Foundation (Weeks 1-2)
────────────────────────────────
□ BOSS Constitution finalized
□ Product Contract signed off
□ Domain model complete
□ Database schema v1
□ API contracts defined
□ Permission matrix v1
□ Security model reviewed
□ Dev environment setup

WAVE 1 — Core Platform (Weeks 3-6)
─────────────────────────────────────
□ Authentication (Supabase Auth)
□ Organization/user management
□ Business onboarding flow
□ AI Audit (5-10 questions → Claude API)
□ Business Health Score algorithm
□ Transformation Report generation
□ Executive Dashboard (MVP)
□ MVP criteria 1-5 passing

WAVE 2 — AI Workforce (Weeks 7-10)
─────────────────────────────────────
□ Loop Runtime v1
□ MCP v1 (prompt + policy registry)
□ First 3 AI employees (Receptionist, Sales Manager, Bookkeeper)
□ Workflow deployment UI
□ KPI tracking dashboard
□ ROI calculator
□ BTE v1 (manual trigger)
□ MVP criteria 6-9 passing

WAVE 3 — Marketplace (Weeks 11-14)
─────────────────────────────────────
□ Template marketplace
□ Industry packs (Dental, Legal, Home Services)
□ Partner portal
□ Consultant portal
□ Revenue share infrastructure
□ BTE v2 (automated)

WAVE 4 — Evolution (Weeks 15+)
────────────────────────────────
□ Developer SDK
□ Enterprise licensing
□ DSO/franchise multi-location
□ Advanced AI workforce (all 13 employees)
□ Business Intelligence & Forecasting
□ Public marketplace launch
```

---

## 8. Security Model

```
Authentication:     Supabase Auth (JWT, MFA, SSO for enterprise)
Authorization:      RBAC + Row Level Security (Supabase RLS)
Tenancy:            Hard isolation via org_id in every query
Data Encryption:    At rest (AES-256), In transit (TLS 1.3)
API Security:       Rate limiting, CORS, request signing
Audit:              Immutable append-only audit log
PII:                Encrypted at column level, access logged
AI Safety:          Token budgets, output filtering, human approval gates
Compliance:         SOC 2 Type II path from Wave 0
```
