# BOSS Canonical Business Model

## Authority

The Canonical Business Model (CBM) is the authoritative business language of
BOSS. The Execution Constitution governs product intent. The CBM governs
business meaning. Registries, runtimes, APIs, Capability Packs, and customer
surfaces must map to this model rather than inventing parallel business objects.

## Definition

BOSS is a Business Execution Operating System built on a Canonical Business
Model, where every observation, decision, execution, and outcome strengthens a
continuously evolving understanding of the business.

## Canonical Model

### 1. Business Identity

Who the business is:

- Organization, brand, industry, locations, contacts, and operating hours.
- Products, services, departments, teams, and people.
- Customers, vendors, assets, jobs, and connected systems.

### 2. Business Intent

What the business wants:

- Vision, goals, objectives, priorities, constraints, and preferences.
- KPIs, outcome targets, approval boundaries, and risk tolerance.

Intent is measurable and versioned. A goal is not executable until it has
success criteria and evidence requirements.

### 3. Business Signal

What happened:

- Human input, conversation, API, webhook, calendar, email, CRM, accounting,
  POS, inventory, marketing, website, workflow, automation, agent, scheduler,
  approval, or execution result.

Every signal carries tenant, source, time, confidence, priority, context,
correlation, and evidence. After the Signal capability certifies, raw sources
may not trigger execution directly.

### 4. Business Graph

The Business Graph is the authoritative relationship and temporal layer. It
contains:

- Business entities and stable identities.
- Relationships and ownership.
- Intent, facts, signals, decisions, plans, executions, and outcomes.
- Evidence and confidence references.
- Historical versions and effective time.

The existing Canonical Business Context seeds the graph. The Knowledge Graph,
Graph Runtime, Semantic Layer, and BQIL are the certified access path.

### 5. Business Memory

Business Memory is not a second database and not chat history. It is the
versioned, evidence-backed semantic view of the Business Graph required for a
specific tenant, scope, and point in time.

Memory includes facts, history, relationships, patterns, preferences, learning,
confidence, context, and execution history. A memory update must reference the
signal or verified outcome that changed the graph.

### 6. Business Opportunity

What can improve:

- Revenue, cost, cash flow, customer experience, sales, marketing, operations,
  staffing, scheduling, inventory, compliance, risk, and growth.

Every opportunity declares impact, confidence, estimated value, risk,
dependencies, explanation, and supporting evidence. Detection does not imply
approval or execution.

### 7. Business Decision

What should happen:

- Recommendation, alternatives, tradeoffs, risk, confidence, estimated value,
  required approvals, departments consulted, and evidence.

Decisions are immutable records. A later decision supersedes rather than
silently rewriting prior reasoning.

### 8. Business Plan

How an approved decision becomes executable:

- Objective, tasks, dependencies, owners, systems, timeline, milestones, KPIs,
  approval gates, rollback/compensation, verification, and evidence criteria.

No business execution begins without a validated plan or a governed
pre-approved execution policy.

### 9. Business Execution

What BOSS did:

- One UCR execution identity, context, capability version, plan reference,
  approvals, stage history, evidence, telemetry, and terminal state.

New business capabilities execute through UCR. Existing specialized runtimes
remain compatibility infrastructure until their migration is certified.

### 10. Business Outcome

What changed:

- Success or failure, expected versus actual result, KPI movement, latency,
  cost, business value, ROI, customer/owner feedback, and evidence.

Execution completion is not outcome success. Verification determines whether
business value occurred.

### 11. Business Evolution

What was learned:

- Verified outcomes may update graph facts, confidence, patterns, blueprint,
  reasoning, approval policy, and future planning.

Learning is additive, versioned, explainable, and reversible. Synthetic or
unverified outcomes cannot become business truth.

## Universal Business Lifecycle

```text
Observe
-> Remember
-> Understand
-> Detect and Prioritize
-> Decide
-> Plan
-> Approve
-> Execute
-> Verify
-> Learn
-> Evolve
```

Every stage preserves tenant, version, correlation, trace, evidence, confidence,
and actor identity.

## Canonical Invariants

1. Every object has stable identity, tenant, owner, version, lifecycle, and
   timestamps.
2. Every derived assertion references evidence and confidence.
3. Every relationship resolves through the Business Graph platform.
4. Every business read model resolves through Semantic Layer and BQIL.
5. Every new execution uses UCR and references the decision/plan that allowed
   it.
6. Every outcome references its execution and verification evidence.
7. Every learning update references verified outcomes and creates a new graph
   version.
8. Industry Packs specialize taxonomies, rules, templates, and views; they may
   not create competing base entities or execution engines.
9. Customer surfaces use canonical read models and never fabricate operational
   state.
10. No capability may privately redefine Organization, Goal, Signal,
    Opportunity, Decision, Plan, Execution, Outcome, or Evidence.

## Industry Specialization

Dentistry, HVAC, restaurants, retail, legal, accounting, construction, medical,
automotive, and future industries use the same canonical lifecycle. Industry
Packs may add typed attributes, relationship definitions, policies, diagnostic
rules, execution templates, KPIs, and semantic views through governed extension
points.

## Current Implementation Map

| CBM concept | Current platform source | Status |
| --- | --- | --- |
| Identity | Identity and organization runtime | Engineering GO with environmental blockers |
| Business Identity/Intent | Canonical Business Context | Engineering GO |
| Business Graph | Graph Foundation and Runtime | Engineering GO with environmental blockers |
| Business meaning | Semantic Layer and BQIL | Engineering GO |
| Capability packaging | Capability Pack Platform | Engineering GO |
| Execution | UCR Batches 1-2 | Engineering GO |
| Diagnostics | Existing deterministic intelligence | Pre-CBM compatibility path |
| Signals | Not implemented as canonical capability | Entry-gated |
| Business Memory | Not implemented as canonical graph view | Entry-gated |
| Opportunity/Decision/Plan | Partial legacy models; no canonical PI-2 contracts | Entry-gated |
| Outcome verification/learning | Not implemented canonically | Entry-gated |
| Replay | Not implemented in UCR | UCR Batch 3 prerequisite |

This table prevents architecture documents from presenting target concepts as
completed capabilities.

## Extension Test

Before adding a business object:

1. Can it be represented by an existing canonical entity, relationship, event,
   intent, execution, or outcome?
2. Is it an industry-specific attribute or policy rather than a new base type?
3. Which graph node/relationship and semantic view own it?
4. Which evidence and lifecycle rules apply?
5. Which migration preserves existing contracts?

New base concepts require an ADR and CBM compatibility review.
