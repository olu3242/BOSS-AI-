# ADR-0004: Constraint Intelligence Engine — registry-driven detection rules, structured impact estimation, deterministic priority scoring

**Status:** accepted
**Date:** 2026-06-26

## Context

Goal 3 requires a deterministic, explainable, registry-driven reasoning
layer that detects, classifies, prioritizes, and explains Business
Constraints from existing Business Profile/MRI/DNA/Health/Capability/
Timeline data. The goal explicitly excludes AI agents, workflows, Loop
Runtime involvement, and recommendations — this is strictly a "detect and
explain" layer, one step beyond Goal 2's "understand the business" layer.

Four architectural questions needed resolving: (1) how constraint
detection rules should be declared so the engine is genuinely registry-
driven rather than a pile of bespoke detector functions, (2) how
financial/customer/operational impact should be estimated without
hallucinating numbers, (3) how priority should be computed deterministically
and explainably, (4) how a brand-new MCP engine that reads from
`@boss/registries` gets those registries populated at runtime, since no
existing caller installs the general-smb capability pack outside its own
tests.

## Decisions

1. **Declarative `ConstraintDetectionRule` union, not per-constraint
   code.** `packages/registries/src/registries/constraintDefinition.ts`
   defines five rule shapes (`mri_response_equals`, `mri_response_in`,
   `mri_response_includes`, `health_dimension_below`,
   `capability_maturity_in`). Each of the 20 general-SMB constraint
   definitions declares its own `detectionRules` array; matching any
   rule is sufficient evidence to fire. `packages/mcp/src/intelligence/constraintEngine.ts`
   evaluates these declaratively via `evaluateRule()` — adding a new
   constraint requires zero engine changes, only a new registry entry.
2. **Fixed, scaled `ConstraintImpactModel`, never invented values.** Each
   constraint definition carries a base impact model
   (`revenueLossAnnualBase`, `timeLostHoursWeekly`, and four
   `ImpactLevel` fields). The engine scales the numeric fields by a
   `sizeFactor` derived deterministically from `employeeCount`
   (`max(1, min(3, employeeCount / 5))`) and derives `confidence` from
   evidence count. No LLM or free-form estimation is involved anywhere
   in the impact path.
3. **Deterministic weighted scoring, fixed thresholds.** `prioritizeConstraints()`
   computes a 0–100 `overallScore` as a fixed weighted sum of six
   sub-scores (business impact 0.3, financial 0.25, customer 0.15,
   urgency 0.15, automation 0.10, confidence 0.05) and buckets it into
   five `ConstraintPriorityLevel`s via fixed thresholds (≥80 critical,
   ≥60 high, ≥40 medium, ≥20 low, else informational). This mirrors the
   same "explainable, no black box" requirement the goal places on
   evidence.
4. **`apps/api` now depends on `@boss/industry-pack-general-smb` and
   installs it at container-construction time.** `installGeneralSmbPack()`
   was made idempotent (a module-level `installed` guard) since
   `createRegistry().register()` throws on duplicate keys and both
   `createPostgresContainer()` and `createInMemoryContainer()` (and any
   test that constructs multiple containers) need to call it safely.
   This was a pre-existing latent gap: Goal 2's derivation functions
   (`deriveBusinessHealth`, `evaluateCapabilities`) don't actually depend
   on the registries being populated to produce *some* output (health
   weights default to 0; capability dependencies come from a hardcoded
   map in `capabilityGraph.ts`), so the gap went unnoticed until the
   constraint engine's `constraintDefinitionRegistry.list()` call made it
   load-bearing. Verified no dependency-cruiser rule forbids
   `apps/api → industry-packs`.

## Consequences

- Same dual repository adapter pattern (Postgres + in-memory) as Goal 2,
  extended to constraints: `businessConstraintRepository`,
  `constraintScoreRepository`, `constraintPriorityRepository`. The
  in-memory `ConstraintPriorityRepository` is constructed with a
  reference to the in-memory `BusinessConstraintRepository` (rather than
  being zero-arg like its siblings) because `ConstraintPriority` does
  not denormalize `businessId` — it must resolve valid constraint IDs for
  a business by delegating to the constraint repository.
- `packages/db/migrations/0004_constraint_intelligence.sql` and
  `0005_seed_constraint_library.sql` were applied and validated against
  a live local Postgres instance (`boss_dev`): 8 new tables, 13 seeded
  categories, 20 seeded definitions, matching the TypeScript registry
  data exactly.
- Constraint relationship/graph tables (`constraint_relationships`) and
  history (`constraint_history`) are persisted but not yet exposed
  through any API service — read paths for the Constraint Graph are
  deferred (see Tech Debt).
- No UI for constraints is implemented in this goal, consistent with
  Goal 2's deferral of `apps/web` pages.

## Alternatives Considered

- Bespoke per-constraint detector functions: rejected — directly
  violates the goal's "Registry Driven" and "Composable" architecture
  requirements and would require an engine code change for every new
  constraint added to a future industry pack.
- Seeding registries lazily inside the constraint engine itself:
  rejected — would blur the line between MCP (pure intelligence) and
  pack installation (a platform/bootstrap concern), and would make engine
  behavior depend on import order rather than explicit container wiring.
