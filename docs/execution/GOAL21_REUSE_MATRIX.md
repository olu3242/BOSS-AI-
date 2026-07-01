# Goal 21 — Reuse Matrix

**Date:** 2026-06-30

| Component | Location | Goal 21 Step | Verdict |
|-----------|----------|--------------|---------|
| `KpiMeasurementService.measure()` | `kpiMeasurementService.ts` | Step 2: Measure KPIs | REUSE |
| `BusinessHealthService.getHealth()` | `businessHealthService.ts` | Step 3: Update Health | REUSE |
| `RootCauseService.analyze()` | `rootCauseService.ts` | Step 4: Generate Insights | REUSE |
| `BusinessRecommendationService.analyze()` | `businessRecommendationService.ts` | Step 4: Generate Insights | REUSE |
| `BusinessDecisionService.generate()` | `businessDecisionService.ts` | Step 5: Produce Decisions | REUSE |
| Planning Engine | NEW `planningEngine.ts` | Step 6: Create Plans | NEW |
| `WorkflowGenerationService.generateAndExecute()` | `workflowGenerationService.ts` | Step 7: Execute Workflows | REUSE |
| `LoopRuntimeService.execute()` | `loopRuntimeService.ts` | Step 7: Execute Workflows | REUSE |
| Verification Engine | NEW `verificationEngine.ts` | Step 8: Verify Outcomes | NEW |
| `MemoryRecordRepository.upsert()` | `packages/db` | Step 10: Update Memory | REUSE |
| `BusinessDecisionService.measure()` | `businessDecisionService.ts` | Step 10: Update Memory | REUSE |
| `KpiMeasurementService.measure()` | `kpiMeasurementService.ts` | Step 11: Recalculate KPIs | REUSE |
| `EventLogRepository` | `packages/db` | All steps: evidence | REUSE |
| `DurableEventBus` | `packages/events` | All steps: events | REUSE |
| `ObservabilityService` | `observabilityService.ts` | All steps: telemetry | REUSE |
| `optimizeDecisions()` | `decisionOptimization.ts` | WS5: Optimization | REUSE |
| `MissionControlService.getSnapshot()` | `missionControlService.ts` | WS7: Exec Center | EXTEND |
| All 24 existing registries | `packages/registries` | All steps | REUSE |
| `decisionRegistry` (Goal 20) | same | WS1/WS2 | REUSE |
| `forecastRegistry` (Goal 20) | same | WS5 | REUSE |
| `playbookRegistry` (Goal 20) | same | WS2/WS4 | REUSE |
| `businessRuleRegistry` (Goal 20) | same | WS1 | REUSE |
