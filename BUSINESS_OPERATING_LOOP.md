# BOSS Business Operating Loop

## Authority

The Business Operating Loop (BOL) is the canonical continuous operating cycle
for BOSS. Workflows, agents, automations, and Capability Packs participate in
the loop; none replaces or bypasses it.

The BOL is a target operating contract. Stages become executable only when
their prerequisite capabilities are certified.

## Canonical Loop

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
-> Observe Again
```

### Observe

Capture tenant-scoped facts and events as evidence-bearing Business Signals.

### Remember

Apply validated signals to the Business Graph and create a new versioned
Business Memory view. Raw or unverified input remains an assertion, not fact.

### Understand

Resolve context, relationships, history, confidence, and likely business
meaning through the Knowledge Platform.

### Detect and Prioritize

Identify gaps, risks, constraints, and opportunities. Rank by business impact,
urgency, confidence, risk, goal alignment, and dependencies.

### Decide

Evaluate alternatives, evidence, expected value, risk, policy, and uncertainty.
Record the recommendation and reasoning without silently rewriting history.

### Plan

Create measurable tasks, dependencies, owners, systems, timeline, success
criteria, rollback/compensation, verification, and evidence requirements.

### Approve

Resolve policy and human approval based on risk, confidence, permissions, and
progressive automation level.

### Execute

Run the approved plan through UCR with one execution identity, immutable
context, stage history, telemetry, and evidence.

### Verify

Confirm both technical completion and intended business outcome. Compare
expected and actual KPI movement, value, cost, latency, and feedback.

### Learn

Update confidence and future decision inputs only from verified evidence.
Failure is learning evidence, not permission to invent a conclusion.

### Evolve

Propose versioned changes to the Business Graph, blueprint, SOPs, priorities,
policies, templates, and plans. Governed changes feed the next observation
cycle.

## Execution Confidence

Every proposed execution declares confidence derived from:

- Evidence quality and freshness.
- Business Memory completeness.
- Similar verified outcomes.
- Dependency and context completeness.
- Historical execution reliability.
- Verification coverage.

Confidence does not authorize action by itself:

| Confidence | Default posture |
| --- | --- |
| High | Eligible for policy-controlled automatic execution |
| Medium | Prepare and request approval |
| Low | Recommend, explain uncertainty, request information |

Policy, permissions, tenant boundaries, risk, and owner preferences always
constrain automation.

## Loop Invariants

- Every stage uses the same tenant, correlation, trace, evidence, and lifecycle
  identity chain.
- Business Graph and canonical semantic services own business state.
- New execution uses UCR.
- Verification separates task completion from business outcome.
- Learning cannot precede verification.
- Evolve creates versions; it does not mutate history.
- A failure pauses or redirects a cycle through governed recovery; it does not
  skip stages.
- Customer surfaces show current loop state and the next evidence-backed action.

## Current Readiness

| Stage | Current status |
| --- | --- |
| Observe/Remember | Canonical Signal and Memory capabilities not implemented |
| Understand | Context, Graph, Semantic Layer, and BQIL Engineering GO |
| Detect/Prioritize | Partial legacy intelligence; canonical PI-2 work gated |
| Decide/Plan/Approve | Partial platform contracts; canonical PI-2 work gated |
| Execute | UCR Batches 1-2 Engineering GO |
| Verify/Learn/Evolve | Canonical capabilities not implemented |

The loop is architecturally adopted but not yet operational end to end.
