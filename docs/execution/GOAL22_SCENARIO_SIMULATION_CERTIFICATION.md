# Goal 22 Certification: Scenario Simulation Engine

**Date:** 2026-06-30  
**Status:** CERTIFIED ✓

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Deterministic scenario calculations for revenue/hiring/pricing/expansion/marketing/finance | ✓ |
| 2 | Scenario assumptions drive calculations (no LLM in math) | ✓ |
| 3 | Multi-period forecast (30d/90d/180d/365d) with confidence decay | ✓ |
| 4 | Scenario comparison with ROI × confidence × risk ranking | ✓ |
| 5 | scenario.created and scenario.compared events emitted | ✓ |
| 6 | Comparison records persisted for audit trail | ✓ |
| 7 | Longer forecast periods produce higher projected revenue | ✓ |

## Tests

File: `apps/api/src/__tests__/scenarioFlow.test.ts` — **6 tests, all passing**

- `creates and calculates a revenue scenario`
- `creates a hiring scenario with cost analysis`
- `lists scenarios for a business`
- `compares multiple scenarios and recommends best`
- `generates a multi-period forecast`
- `emits scenario.created event`

## Scenario Types

| Type | Key Assumptions | Risk Logic |
|---|---|---|
| revenue | revenue_growth_pct | high if growth > 30% |
| marketing | budget_increase_pct, lead_lift_pct | always medium |
| hiring | new_headcount, avg_salary_annual, productivity_gain_pct | high if cost > gain |
| pricing | price_lift_pct, churn_risk_pct | high if churn > 15% |
| expansion | location_cost_annual, revenue_per_location | always high |
| finance | cost_reduction_pct | always low |

## Key Files

- `packages/mcp/src/intelligence/scenarioEngine.ts`
- `apps/api/src/services/scenarioService.ts`
- `packages/db/migrations/0016_scenarios.sql`
- `packages/db/src/repositories/postgres/businessScenarioRepository.ts`
