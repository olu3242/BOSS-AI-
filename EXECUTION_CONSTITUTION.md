# BOSS Execution Constitution

## Authority

This is the highest-level product and engineering constitution for BOSS.
The Operating Principles govern company decisions. The Canonical Business
Model defines business meaning. The Business Operating
Loop defines continuous operation. The Business Maturity Model defines customer
evolution. The Customer Lifecycle Framework defines the customer journey. The
Master Program Plan defines sequence. The Engineering Operating System defines
daily execution. Architecture Governance defines enforcement.

When documents conflict, this constitution controls product intent, the
Canonical Business Model controls business semantics, and executable evidence
controls certification claims.

## Constitutional Principles

1. **BOSS is a Business Execution Operating System.** Work that does not
   improve business execution or its safety belongs outside the product.
2. **Execution is the product.** AI, agents, automations, workflows, and
   dashboards are supporting capabilities.
3. **Everything begins as a Business Signal.** Raw sources may not directly
   trigger business execution after the Signal capability is certified.
4. **Business Memory is the canonical business state.** It must compose the
   certified Business Context and Knowledge Platform rather than duplicate
   them. No hidden or isolated business state.
5. **Execution, recommendations, and learning require evidence.**
6. **Recommendations are explainable.** They declare what happened, why,
   evidence, confidence, expected outcome, and risk.
7. **Nothing bypasses UCR.** New business capabilities use the Universal
   Capability Runtime. Legacy paths require an explicit migration record.
8. **Every execution is replayable before Production GO.**
9. **Every execution is measurable.** Capture latency, outcome, business
   value, confidence, success, and failure.
10. **Business Memory evolves through verified facts and outcomes.** Learning
    may not fabricate state.
11. **Owners configure outcomes, boundaries, and approvals, not internal
    workflow mechanics.**
12. **Trust is progressive.** Deliver value before requesting additional
    access or integrations.
13. **Automation is progressive:** recommend, prepare, ask, execute.
14. **Core value cannot require integrations.** Integrations improve evidence
    and execution reach; they do not create the product's intelligence.
15. **Every customer surface answers "What should I do next?"** Informational
    views must connect to an evidence-backed action or decision.
16. **Time to First Business Value targets five minutes.**
17. **Business value outranks speculative technical sophistication.**
18. **Every change states the business problem, execution improvement, and
    evidence of success.**
19. **No skeleton product surfaces.** No fake dashboards, placeholder metrics,
    mock execution, or simulated outcomes may be certified.
20. **Every capability improves Observe, Understand, Decide, Plan, Execute, or
    Learn.**

## Execution Pyramid

```text
                  BUSINESS OUTCOMES
                         ^
                Executive Intelligence
                         ^
                   Business Memory
                         ^
                Universal Runtime
                         ^
                  Business Signals
                         ^
                  Business Systems
```

## Enforcement State

The constitution is effective immediately for new work. Some target invariants
depend on uncertified capabilities:

- Business Signals and Business Memory are not yet certified.
- UCR Batches 1-2 are certified; resilience and platform-wide migration remain.
- Replay, outcome verification, progressive learning, and five-minute value
  require later certified increments.

Until those capabilities certify, existing Canonical Business Context,
Knowledge Platform, Evidence, and specialized runtime contracts remain the
authoritative production-safe paths. No document may claim future invariants
are already enforced.

## Constitutional Test

Before implementation, answer:

1. Which business problem does this solve?
2. Which of Observe, Understand, Decide, Plan, Execute, or Learn improves?
3. What evidence proves the improvement?
4. Which canonical state and execution path does it use?
5. What is the tenant, governance, failure, replay, and observability model?

A capability that cannot answer these questions does not enter implementation.
