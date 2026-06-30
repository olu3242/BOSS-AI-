# Goal 21 Certification: Decision Intelligence Core

**Date:** 2026-06-30  
**Status:** CERTIFIED ✓

## Acceptance Criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Decisions generated from health data + recommendations + constraints | ✓ |
| 2 | Decision lifecycle: generated → approved → rejected → scheduled → measured | ✓ |
| 3 | Decision health evaluation with issues and recommendations | ✓ |
| 4 | Priority ranking for pending decisions (ROI × confidence × risk) | ✓ |
| 5 | Learning loop: measured outcomes persisted to business memory | ✓ |
| 6 | Domain events emitted for all lifecycle transitions | ✓ |
| 7 | Throws when no health data exists | ✓ |
| 8 | Law 1 preserved: all intelligence in MCP, zero in Loop | ✓ |

## Tests

File: `apps/api/src/__tests__/decisionFlow.test.ts` — **9 tests, all passing**

- `generates a decision when health data exists`
- `throws when no health data exists`
- `lists decisions for a business`
- `evaluates decision health`
- `approves a decision and emits event`
- `rejects a decision`
- `schedules an approved decision`
- `measures outcome and persists to business memory`
- `produces priority ranking for pending decisions`

## Key Files

- `packages/mcp/src/intelligence/decisionEngine.ts`
- `packages/mcp/src/intelligence/decisionOptimization.ts`
- `apps/api/src/services/businessDecisionService.ts`
- `packages/db/migrations/0015_decisions.sql`
- `packages/db/src/repositories/postgres/businessDecisionRepository.ts`
