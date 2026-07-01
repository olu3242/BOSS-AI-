# ADR-0018: Business Decision Intelligence Operating System (Goals 21–23)

**Date:** 2026-06-30  
**Status:** Accepted  
**Deciders:** BOSS Engineering  

---

## Context

BOSS needed an executive decision layer that could translate business intelligence outputs (health scores, constraints, recommendations) into structured, explainable decisions with full lifecycle management — while preserving the Two Laws: MCP owns intelligence, Loop owns execution.

Three goals were implemented together as a cohesive system:
- **Goal 21**: Decision Intelligence Core
- **Goal 22**: Scenario Simulation Engine
- **Goal 23**: Executive Decision Intelligence

---

## Decision

### Law 1 Preservation

All intelligence lives in `packages/mcp`:
- `decisionEngine.ts` — deterministic decision generation and health evaluation
- `scenarioEngine.ts` — deterministic scenario math (no LLM in calculations)
- `executiveBrief.ts` — Claude-powered or deterministic executive briefs
- `decisionOptimization.ts` — optimization signals and learning loop analysis

Services in `apps/api` coordinate between MCP (intelligence) and repos (persistence). Loop Runtime executes workflows generated from approved decisions — zero business knowledge crosses into Loop.

### Reuse Over Duplication

| Capability | Reused Component |
|---|---|
| Learning loop | `repos.memoryRecords.upsert()` with key `decision:{id}:outcome` |
| Workflow generation | Existing `workflowGenerationService` triggered on decision approval |
| Dashboard | Mission Control snapshot extended with `decisions` + `activeScenarios` |
| Evidence store | Existing `ProviderEvidence` pattern |
| Event bus | Existing `repos.eventBus.publish()` |
| Policy engine | Existing policy registry for `appliedPolicyKeys` |

### Decision Lifecycle

```
draft → generated → reviewed → approved ─┬─ scheduled → executing → completed → measured → archived
                                          └─ rejected
```

Lifecycle transitions are enforced by the service layer. Each transition emits a domain event.

### Scenario Simulation

All calculations are deterministic math per `ScenarioType`. LLM reasoning may explain results but never drives calculations (Law 1). The `FORECAST_MULTIPLIER` map converts annual base revenue to period-specific projections.

### Executive Intelligence

`generateExecutiveBrief()` uses `claude-sonnet-4-6` when `ANTHROPIC_API_KEY` is set. When absent (tests, staging without key), a deterministic fallback brief is generated from the same inputs — making all tests key-free.

---

## Consequences

- 3 new domain types: `BusinessDecision`, `BusinessScenario`, `ScenarioComparison`
- 2 new DB migrations: `0015_decisions.sql`, `0016_scenarios.sql`
- 2 new in-memory + Postgres repositories
- Mission Control snapshot enriched with live decision queue and active scenarios
- 91 integration tests all passing
- Zero architecture duplication
