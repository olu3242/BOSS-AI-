# BOSS Product Operating Model

## Purpose

The Product Operating Model (POM) converts BOSS strategy into customer-value
decisions. It governs whether a roadmap item is ready to enter engineering.

The POM does not define runtime architecture or replace the Execution
Constitution, Canonical Business Model, Business Operating Loop, Engineering
Operating System, or certification gates. It ensures that technically valid
work also solves a clear small-business problem with measurable value.

## Product Decision

Work begins with a customer problem and intended outcome, not a proposed
feature.

```text
Business problem
-> Customer outcome
-> Time to value
-> Operating Loop impact
-> Trust and simplicity
-> Evidence plan
-> Engineering batch
-> Verified customer value
```

Product approval permits a bounded batch to enter engineering. It does not
constitute architecture approval, implementation certification, or release
approval.

## Product Gates

Every roadmap item must pass all five gates before implementation begins.
Defect, security, and incident work may use the emergency process, but must
still document the affected customer outcome.

### Gate 1: Business Problem

Define:

- The specific customer and problem.
- Current observable evidence.
- The measurable outcome, not merely the feature.
- Why the problem matters now.
- What is explicitly out of scope.

Use customer language. For example, prefer "reduce missed appointments" over
"build AI scheduling."

**Pass:** a small-business owner can recognize the problem and desired outcome.

### Gate 2: Time to Value

Define the earliest point at which the customer receives useful, observable
value:

| Time to value | Product posture |
| --- | --- |
| Less than five minutes | Preferred |
| Same day | Acceptable with justification |
| Within one week | Redesign or explicitly stage value |
| More than one week | Does not enter implementation without product review |

Setup time, required data, permissions, integrations, and human effort are
part of the measurement.

**Pass:** the batch has a measured value milestone and does not defer all value
until a future capability.

### Gate 3: Execution Impact

Identify the Business Operating Loop stage materially improved:

- Observe
- Remember
- Understand
- Detect and Prioritize
- Decide
- Plan
- Approve
- Execute
- Verify
- Learn
- Evolve

The work must strengthen at least one stage without bypassing the canonical
loop, state owner, or UCR execution path.

**Pass:** the improvement and its upstream and downstream contracts are clear.

### Gate 4: Trust Impact

Define how the work preserves or improves:

- Transparency and explainability.
- Customer control and approval.
- Data ownership, privacy, and tenant isolation.
- Reversibility, recovery, and risk containment.
- Evidence and confidence visibility.

**Pass:** trust does not decrease. Any new authority is progressive,
policy-governed, and revocable.

### Gate 5: Simplicity

Apply the Day-One Test:

> Can a business owner explain the capability and its value to another business
> owner in under one minute?

The customer should not need to understand agents, registries, graphs, packs,
pipelines, or runtime internals to obtain value.

**Pass:** the intended interaction is understandable without implementation
documentation, and unnecessary configuration is removed or deferred.

## Product Scorecard

Score each dimension from 0 to 5 using evidence available at intake.

| Dimension | Evaluation |
| --- | --- |
| Business Outcome | Solves a meaningful, specific customer problem |
| Time to Value | Delivers observable benefit quickly with little setup |
| Execution Impact | Strengthens a defined Business Operating Loop stage |
| Trust | Improves confidence, control, explainability, or risk |
| Simplicity | Is understandable and usable by a non-technical owner |
| Reusability | Extends accepted platform contracts without duplication |
| Evidence | Defines an objective way to verify customer value |

Scoring interpretation:

- `0`: absent or contradicted.
- `1`: assertion only.
- `2`: plausible but materially incomplete.
- `3`: clear and supported enough for a bounded implementation.
- `4`: strong evidence and a low-friction delivery path.
- `5`: validated customer evidence or a repeatable proven pattern.

A roadmap item is product-ready only when:

- All five product gates pass.
- Business Outcome, Trust, Simplicity, and Evidence each score at least 3.
- The total score is at least 24 out of 35.
- The work maps to one bounded Epic, Capability, and Batch.

A score does not override dependencies, architecture review, security,
certification, or a failed validation gate.

## Small Business Filter

Before approving an item, answer:

> Would a business with five employees receive meaningful value from this next
> month?

If not, the item should be deferred, delivered through an Industry or
Capability Pack, assigned to a later maturity level, or removed from core
scope. Enterprise extensibility is not sufficient justification for core
product complexity.

## Product Metrics

### North-Star Outcome

Measure:

> Minutes saved and business outcomes improved.

Every released capability must define at least one verifiable customer outcome,
such as:

- Repetitive work eliminated.
- Appointments recovered.
- Revenue generated or collected sooner.
- Cycle time reduced.
- Errors or compliance exposure reduced.
- Retention or customer response improved.
- Owner effort or stress reduced through an explicit feedback measure.

Minutes saved and outcomes improved are reported separately; they are not
collapsed into a fabricated composite number.

### Time to First Business Value

TTFBV remains the primary activation metric. Measure from the customer's first
product interaction to the first persisted, evidence-backed useful outcome.
Instrumentation must identify setup time, waiting time, execution time, and
verification time.

Usage, screen views, agent count, and execution volume are supporting metrics,
not proof of customer value.

## Required Product Intake

Every implementation batch records:

- Customer and business problem.
- Intended measurable outcome.
- Customer Lifecycle stage.
- Business Operating Loop stage.
- Time-to-value target and measurement point.
- Product Scorecard with evidence.
- Trust and approval impact.
- Day-One Test statement.
- Small Business Filter result.
- Non-goals.
- Owner and verification plan.

The pull request carries this intake forward and reports actual validation.
Certification compares the intended outcome with executable evidence; it does
not repeat the intake claim as proof.

## Decision Outcomes

Product review issues one result:

- **Ready:** passes the POM and may enter normal engineering gates.
- **Revise:** the problem is valid but value, scope, trust, simplicity, or
  evidence is incomplete.
- **Defer:** useful at a later maturity level or after a prerequisite.
- **Pack:** valuable specialization that should not enter the platform core.
- **Reject:** no sufficient customer outcome or conflicts with product
  principles.

The result, rationale, score, owner, and date must be recorded with the roadmap
item or batch certification.

## Relationship to Engineering

The POM answers, "Should BOSS build this, for whom, and how will value be
known?"

The Engineering Operating System answers, "How is the approved batch
implemented and certified?"

The Architecture Review Board answers, "Does it preserve the accepted platform
contracts?"

All three approvals are necessary where applicable. None substitutes for
executable validation.

## Current Adoption

The POM is adopted as a prospective product-intake gate. Existing certified
capabilities retain their certification. In-progress UCR work remains governed
by its accepted ADRs and batches; the POM applies to newly proposed scope and
does not expand those batches.

