# GOAL 22 — Reuse Matrix

**Date:** 2026-07-01
**Status:** COMPLETE

---

## Mandate

Every Goal 22 component must map to an existing backend capability. If a component cannot be mapped, it is out of scope.

---

## Workstream 1 — Unified Executive Workspace

| Goal 22 Component | Reuses | How |
|-------------------|--------|-----|
| Workspace layout shell | `apps/web/src/` Next.js App Router | Add new layout.tsx wrapping existing routes |
| Business health summary | `GET /businesses/:id/health` | `businessHealthService.getHealth()` |
| Active decisions panel | `GET /businesses/:id/decisions` | `businessDecisionService.listDecisions()` |
| Operating loop status | `GET /businesses/:id/mission-control` | `missionControlService.getMissionControl()` |
| KPI summary strip | `GET /businesses/:id/kpis/measure` | `kpiMeasurementService.measureKpis()` |
| Workspace registry config | `workspaceRegistry` (new, additive) | Layout + module config per workspace type |
| `workspace.view.loaded` event | `DurableEventBus` | Existing event bus, new event type only |

**Zero new services. Zero new repositories. Zero new MCP modules.**

---

## Workstream 2 — Unified Business Timeline

| Goal 22 Component | Reuses | How |
|-------------------|--------|-----|
| Timeline feed UI | `GET /businesses/:id/timeline` | `businessTimelineService.getTimeline()` |
| Timeline filter/sort | `timelineEngine.ts` in MCP | Existing engine, add filter params |
| Timeline event display | `timelineEventRegistry` | Existing registry entries |
| Timeline registry config | `timelineRegistry` (new, additive) | Filter presets and display config |
| `timeline.updated` event | `DurableEventBus` | Existing event bus, new event type only |

**Zero new services. Zero new repositories. Zero new MCP modules.**

---

## Workstream 3 — Unified Approval Center

| Goal 22 Component | Reuses | How |
|-------------------|--------|-----|
| Pending approvals list | `GET /businesses/:id/decisions` (status=reviewed) | `businessDecisionService.listDecisions()` |
| Approve action | `POST /decisions/:id/approve` | `businessDecisionService.approveDecision()` |
| Reject action | `POST /decisions/:id/reject` | `businessDecisionService.rejectDecision()` |
| Recommendation approvals | `POST /recommendations/:id/approve` | `businessRecommendationService.approveRecommendation()` |
| Approval workflow templates | `approvalRegistry` (new, additive) | Approval type configs |
| Executive brief display | `GET /decisions/:id/brief` | `executiveBriefEngine.generateExecutiveBrief()` |
| `approval.completed` event | `DurableEventBus` | Existing event bus, new event type only |

**Zero new services. Zero new repositories. Zero new MCP modules.**

---

## Workstream 4 — Unified Automation Center

| Goal 22 Component | Reuses | How |
|-------------------|--------|-----|
| Integration list | `GET /businesses/:id/integrations` | `toolFabricService.listIntegrations()` |
| Connect integration | `POST /businesses/:id/integrations/:key/connect` | `toolFabricService.connectIntegration()` |
| Disconnect integration | `POST /businesses/:id/integrations/:key/disconnect` | `toolFabricService.disconnectIntegration()` |
| Tool permissions | `GET /businesses/:id/permissions` | `toolFabricService.listPermissions()` |
| Tool execution history | `GET /businesses/:id/tools/executions` | `toolFabricService.listExecutions()` |
| Provider health | `GET /businesses/:id/providers/health` | `toolFabricService.listProviderHealth()` |
| Workflow schedules | `schedulerService.listSchedules()` | Existing scheduler service |
| Automation rule templates | `automationCenterRegistry` (new, additive) | Rule template library |
| `automation.status.changed` event | `DurableEventBus` | Existing event bus, new event type only |

**Zero new services. Zero new repositories. Zero new MCP modules.**

---

## Workstream 5 — Unified Intelligence Center

| Goal 22 Component | Reuses | How |
|-------------------|--------|-----|
| Root cause display | `POST /businesses/:id/root-cause/analyze` | `rootCauseService.analyzeRootCauses()` |
| Optimization report | `GET /businesses/:id/decisions/optimize` | `optimizationEngine.generateOptimizationReport()` |
| Scenario comparison | `GET /businesses/:id/scenarios` + `/compare` | `scenarioService.listScenarios()` + compare |
| Recommendation roadmap | `GET /businesses/:id/recommendations/roadmap` | `businessRecommendationService.getRoadmap()` |
| KPI readings display | `GET /businesses/:id/kpis/measure` | `kpiMeasurementService.measureKpis()` |
| Intelligence summary config | `intelligenceCenterRegistry` (new, additive) | Summary panel configuration |
| `intelligence.summary.generated` event | `DurableEventBus` | Existing event bus, new event type only |

**Zero new services. Zero new repositories. Zero new MCP modules.**

---

## Workstream 6 — Unified Settings & Governance

| Goal 22 Component | Reuses | How |
|-------------------|--------|-----|
| Business profile edit | `GET /businesses/:id` | `businessProfileService.getBusiness()` |
| Tool audit log | `GET /businesses/:id/tools/audit` | `toolFabricService.getAuditHistory()` |
| Permission management | `POST/GET /businesses/:id/permissions` | `toolFabricService.*Permissions()` |
| MRI management | `GET /mri/:mriId/responses` | `businessMriService.getResponses()` |
| Capability report | `GET /businesses/:id/capabilities` | `businessCapabilityService.listCapabilities()` |

**Zero new services. Zero new repositories. Zero new MCP modules.**

---

## Workstream 7 — Registry Harmonization

| New Registry | Extends | Purpose |
|--------------|---------|---------|
| `workspaceRegistry` | `createRegistry<WorkspaceEntry>()` | Workspace layout + module config per type |
| `timelineRegistry` | `createRegistry<TimelineEntry>()` | Timeline filter presets, display rules |
| `approvalRegistry` | `createRegistry<ApprovalEntry>()` | Approval workflow type templates |
| `automationCenterRegistry` | `createRegistry<AutomationEntry>()` | Automation rule templates |
| `intelligenceCenterRegistry` | `createRegistry<IntelligenceEntry>()` | Intelligence summary panel config |

All 5 use the existing `createRegistry<T extends RegistryEntry>()` factory. Seeded by `installGeneralSmbPack()`. No new registry infrastructure.

---

## Complete Reuse Summary

| Category | Reused | New |
|----------|--------|-----|
| API Services | 23 existing | 0 |
| HTTP Routes | 62+ existing | 0 |
| MCP Intelligence Modules | 20 existing | 0 |
| Registries | 31 existing | 5 additive |
| Domain Event Types | 15 existing | 5 additive |
| Database Tables | 17 existing | 0 |
| Repository Classes | All existing | 0 |
| Event Bus | Existing `DurableEventBus` | 0 |

**Goal 22 adds: 5 registries + 5 event types + frontend pages/components. Nothing else.**
