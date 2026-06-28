# Business Diagnostic Engine Certification

Engine Program: 03
Date: 2026-06-27

## Decision

**GO for internal MVP integration.**

**NO-GO for production and Engine Program 04.**

The engine is implemented and tested as a deterministic, advisory bounded
context. Production certification remains blocked by the unfulfilled Business
Discovery Engine prerequisite, deployed tenant/RLS evidence, and the absence
of an authenticated persisted-output dashboard journey.

## Business Outcome

The engine converts completed, persisted business context into:

- Overall and twelve area health/readiness assessments.
- Evidence-backed root-cause findings.
- Evidence-backed opportunity candidates.
- Nine business maturity assessments.
- A transparent priority matrix.
- A plain-language executive summary.
- A versioned canonical diagnostic report.

It does not generate Business Outcome Plans, execution blueprints, workflows,
agent calls, automation commands, or queue work.

## Diagnostic Model

```text
Persisted Business Context
  -> Existing Health and Capability Assessments
  -> Existing Constraint Detection
  -> Existing Evidence-Backed Opportunity Catalog
  -> Weighted Area Gap Analysis
  -> Root Cause Classification
  -> Maturity Assessment
  -> Priority Matrix
  -> Executive Summary
  -> Versioned Diagnostic Persistence
  -> Dashboard Projection
```

The implementation composes existing intelligence rather than duplicating
Discovery, health, constraint, or recommendation algorithms.

## Confidence Methodology

- Health-area confidence comes from persisted health dimensions.
- Process and automation confidence increases with the number of supporting
  capability assessments and is capped at `0.9`.
- Root-cause confidence preserves the constraint engine's evidence-derived
  confidence.
- Opportunity confidence preserves the underlying evidence-backed
  recommendation confidence.
- Maturity confidence is the mean of its contributing area confidence values.
- Overall diagnostic confidence is the mean of all twelve area confidences.
- Opportunities without evidence are excluded.

Confidence is a deterministic evidence-completeness indicator. It is not a
statistically calibrated probability.

## Weighting

`DiagnosticWeightProfile` provides a versioned, data-driven weight for each
area. The default `general_smb@1.0.0` profile is supplied by MCP. Callers may
provide another validated profile without introducing industry-specific code
branches.

## Runtime Integration

The diagnostic service uses the existing event and telemetry contracts:

- `business.diagnostic.started`
- `business.diagnostic.analysis.completed`
- `business.diagnostic.root_cause.identified`
- `business.diagnostic.completed`
- `diagnostic.duration`
- `diagnostic.root_causes`
- `diagnostic.opportunities`

Every event carries organization, actor, request, correlation and trace
context. Loop workflow, agent, queue and scheduler APIs are never invoked.

## Persistence

Migration `0010_business_diagnostic_engine.sql` adds:

- `diagnostic_reports`
- `diagnostic_area_scores`
- `diagnostic_root_causes`
- `diagnostic_opportunities`
- `diagnostic_maturity_assessments`
- `diagnostic_priority_items`

Reports are immutable versions. Previous reports are marked superseded, child
outputs are normalized, every table carries `org_id`, and RLS is enabled.

## Validation Evidence

- Typecheck: 21/21 tasks pass
- Lint: 21/21 tasks pass
- Tests: 68 executable assertions pass
- Production build: 11/11 tasks pass
- Migration validation: migrations `0001` through `0010` apply cleanly in an
  isolated local PostgreSQL schema
- Architecture: 172 modules and 469 dependencies analyzed with zero violations
- Dead-code analysis: pass
- Git whitespace validation: pass

## Known Limitations

- EP02 has no certified canonical Business Context, completion percentage,
  discovery confidence, document ingestion, or authenticated onboarding.
- Trend remains `unknown` until historical diagnostic comparison is added.
- Only the default weight profile is shipped.
- Existing recommendation definitions are reused as opportunity candidates;
  EP04 must transform them into outcome plans without changing EP03.
- No live authenticated diagnostic route consumes the persisted report yet.
- Notifications and production telemetry exporters are absent.
- RLS and repository behavior are not certified against the deployment target.

## EP04 Gate

Engine Program 04 must not begin until:

1. EP02 production prerequisites are closed.
2. Migration `0010` and tenant isolation pass deployed integration tests.
3. The browser journey renders a persisted report without synthetic data.
4. Historical trend/version behavior is verified.
5. Diagnostic failure, retry and audit behavior is operationally observable.
