# ADR-0005: Recommendation Intelligence Engine — constraint-triggered derivation, scaled ROI estimation, deterministic prioritization, persisted transformation roadmap

**Status:** accepted
**Date:** 2026-06-26

## Context

Goal 4 builds the layer that transforms detected Business Constraints into
measurable, ranked, explainable Business Recommendations — "the digital
Business Consultant inside BOSS." It must diagnose, rank, explain, and
forecast. It must explicitly NOT execute anything — execution is deferred
to a future Loop Runtime. This is the natural successor to Goal 3
(Constraint Intelligence Engine): where Goal 3 detects constraints from raw
MRI/Health/Capability signals, Goal 4 derives recommendations from
*already-detected, active* constraints, keeping each layer's reasoning
scope clean.

Four architectural questions needed resolving: (1) what should trigger a
recommendation, (2) how ROI/effort/cost should be estimated without
inventing numbers, (3) how priority and the five-stage Transformation
Roadmap should be computed deterministically, (4) how constraint→
recommendation traceability should be persisted for explainability.

## Decisions

1. **`triggerConstraintKeys` on each `RecommendationDefinitionEntry`, not
   re-evaluation of raw MRI signals.** `packages/registries/src/registries/recommendationDefinition.ts`
   declares `triggerConstraintKeys: string[]`. `packages/mcp/src/intelligence/recommendationEngine.ts`'s
   `generateRecommendations()` matches these against the business's
   currently *active* `BusinessConstraint[]` by `definitionKey` — a
   recommendation only fires once its triggering constraint(s) have
   already been detected and persisted. This keeps the recommendation
   layer's reasoning scoped to the Constraint Graph, exactly as the goal's
   input list (Constraint Graph, not raw MRI) implies.
2. **Fixed, scaled `RecommendationRoiModel`, never invented values.** Each
   recommendation definition carries a base ROI model (revenue increase,
   time saved, administrative reduction, retention/conversion percentages,
   profit impact, owner time saved, risk reduction). The engine scales the
   dollar/hour fields by the same `sizeFactor = max(1, min(3,
   employeeCount / 5))` pattern Goal 3 established, and derives
   `confidence` from the number of matched constraints. No LLM or
   free-form estimation is involved in the ROI path.
3. **Deterministic weighted scoring and a persisted five-stage roadmap.**
   `prioritizeRecommendations()` computes `priorityScore`,
   `businessValueScore`, `implementationScore`, `strategicScore`, and
   `overallScore` as fixed weighted sums of business/financial/customer
   impact, implementation difficulty, automation potential, dependency
   count, and confidence, bucketed into five `RecommendationPriorityLevel`s
   via the same fixed thresholds Goal 3 used (≥80 critical, ≥60 high, ≥40
   medium, ≥20 low, else informational). `buildTransformationRoadmapStages()`
   groups recommendations into the five fixed `RecommendationStage`s
   (`quick_wins`, `short_term`, `medium_term`, `strategic`, `long_term`) —
   every recommendation definition declares exactly one stage. The
   resulting roadmap is a first-class persisted entity
   (`TransformationRoadmap` + `transformation_roadmap_stages`), not a
   derived/recomputed-on-read view.
4. **Constraint→recommendation links are persisted as an explicit join
   table, not a denormalized array.** `recommendation_constraint_links`
   records which `constraint_instance_id`(s) triggered each
   `recommendation_instance_id`, giving the Dependency/Evidence model a
   queryable trace back to the Constraint Graph rather than only a JSON
   blob.

## Consequences

- Same dual repository adapter pattern (Postgres + in-memory) as Goals 2
  and 3, extended to recommendations: `businessRecommendationRepository`,
  `recommendationScoreRepository`, `recommendationPriorityRepository`,
  `transformationRoadmapRepository`. The in-memory
  `RecommendationPriorityRepository` is constructed with a reference to
  the in-memory `BusinessRecommendationRepository` for the same reason
  Goal 3's `ConstraintPriorityRepository` was: `RecommendationPriority`
  does not denormalize `businessId`.
- `packages/db/migrations/0006_recommendation_intelligence.sql` and
  `0007_seed_recommendation_library.sql` were applied and validated
  against a live local Postgres instance (`boss_dev`): 9 new tables,
  13 seeded categories, 15 seeded definitions, matching the TypeScript
  registry data exactly.
- `businessRecommendationService.analyze()` reads only *active*
  constraints (`status === "active"`) — dismissed/resolved constraints no
  longer trigger new recommendations, which is intentional: a dismissed
  constraint should not keep regenerating the same recommendation.
- No UI for the Recommendation Center / Transformation Roadmap is
  implemented in this goal, consistent with Goals 2 and 3's deferral of
  `apps/web` pages — "decision support" UI is explicitly out of scope per
  the goal spec.
- The Approval model (`auto`/`approval_required`/`executive_review`/
  `manual_only`) and the Execution Blueprint concept from the goal spec
  are persisted as data only; nothing in this goal consumes or acts on
  them — that is reserved for a future Loop Runtime.

## Alternatives Considered

- Re-deriving recommendations directly from raw MRI/Health/Capability
  signals (mirroring Goal 3's detection rules exactly): rejected — would
  duplicate Goal 3's reasoning and break the explicit Input separation in
  the goal spec (Constraint Graph as input, not raw signals).
- Recomputing the Transformation Roadmap on every read instead of
  persisting it: rejected — the goal spec treats the roadmap as a
  versioned artifact ("Version everything"), and persisting it keeps
  roadmap history available the same way `recommendation_history` does
  for individual recommendations.
