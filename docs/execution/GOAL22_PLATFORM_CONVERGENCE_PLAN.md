# GOAL 22 — Platform Convergence Plan

**Date:** 2026-07-01
**Status:** APPROVED FOR IMPLEMENTATION

---

## Mission

Converge 23 existing backend services, 62+ existing HTTP routes, and 20 existing MCP intelligence modules into one coherent executive operating experience. No new platform primitives. No duplicate infrastructure. Pure convergence.

---

## Phase 0 — Audit (COMPLETE)

- ✅ `GOAL22_HARMONIZATION_AUDIT.md` — Full codebase inventory
- ✅ `GOAL22_REUSE_MATRIX.md` — Every UI component mapped to existing backend
- ✅ `GOAL22_PLATFORM_CONVERGENCE_PLAN.md` — This document

---

## Implementation Order

### Workstream 7 — Registry Harmonization (First — unblocks all workstreams)

**Why first:** All subsequent workstreams read from these registries to configure their UI modules.

Files to create:
```
packages/registries/src/registries/workspace.ts
packages/registries/src/registries/timeline.ts
packages/registries/src/registries/approval.ts
packages/registries/src/registries/automationCenter.ts
packages/registries/src/registries/intelligenceCenter.ts
```

Update:
```
packages/registries/src/index.ts        — export 5 new registries
packages/mcp/src/index.ts              — export workspaceAggregator
industry-packs/general-smb/src/index.ts — v0.8.0, 5 new seed calls
industry-packs/general-smb/src/data/workspaces.ts
industry-packs/general-smb/src/data/timelines.ts
industry-packs/general-smb/src/data/approvals.ts
industry-packs/general-smb/src/data/automationCenter.ts
industry-packs/general-smb/src/data/intelligenceCenter.ts
```

### Workstream 1 — Unified Executive Workspace

**What:** New `/business/[businessId]/workspace` page with unified navigation shell.

Files:
```
apps/web/src/app/business/[businessId]/workspace/page.tsx
apps/web/src/app/business/[businessId]/workspace/layout.tsx
apps/web/src/components/workspace/WorkspaceShell.tsx
apps/web/src/components/workspace/WorkspaceNav.tsx
apps/web/src/components/workspace/HealthSummary.tsx
apps/web/src/components/workspace/KpiStrip.tsx
apps/web/src/components/workspace/DecisionsPanel.tsx
apps/web/src/components/workspace/LoopStatus.tsx
```

API calls: All reads via existing `missionControlService`, `businessHealthService`, `kpiMeasurementService`, `businessDecisionService`.

New API route: `GET /businesses/:id/workspace` — thin wrapper around `missionControlService.getMissionControl()` + workspace registry config.

New service: `workspaceService` — assembles workspace snapshot from existing repos.

### Workstream 2 — Unified Business Timeline

**What:** `/business/[businessId]/workspace/timeline` — filterable, sortable event feed.

Files:
```
apps/web/src/app/business/[businessId]/workspace/timeline/page.tsx
apps/web/src/components/timeline/TimelineFeed.tsx
apps/web/src/components/timeline/TimelineEntry.tsx
apps/web/src/components/timeline/TimelineFilters.tsx
```

API calls: Existing `GET /businesses/:id/timeline` with filter params.

### Workstream 3 — Unified Approval Center

**What:** `/business/[businessId]/workspace/approvals` — pending decisions + recommendations awaiting action.

Files:
```
apps/web/src/app/business/[businessId]/workspace/approvals/page.tsx
apps/web/src/components/approvals/ApprovalQueue.tsx
apps/web/src/components/approvals/ApprovalCard.tsx
apps/web/src/components/approvals/ExecutiveBrief.tsx
```

API calls: Existing decision + recommendation approve/reject routes.

### Workstream 4 — Unified Automation Center

**What:** `/business/[businessId]/workspace/automation` — integrations, permissions, tool history.

Files:
```
apps/web/src/app/business/[businessId]/workspace/automation/page.tsx
apps/web/src/components/automation/IntegrationList.tsx
apps/web/src/components/automation/PermissionMatrix.tsx
apps/web/src/components/automation/ExecutionHistory.tsx
apps/web/src/components/automation/ProviderHealth.tsx
```

API calls: All existing `toolFabricService` routes.

### Workstream 5 — Unified Intelligence Center

**What:** `/business/[businessId]/workspace/intelligence` — root causes, optimization, scenarios, roadmap.

Files:
```
apps/web/src/app/business/[businessId]/workspace/intelligence/page.tsx
apps/web/src/components/intelligence/RootCausePanel.tsx
apps/web/src/components/intelligence/OptimizationReport.tsx
apps/web/src/components/intelligence/ScenarioComparison.tsx
apps/web/src/components/intelligence/RecommendationRoadmap.tsx
```

API calls: All existing intelligence/analysis routes.

### Workstream 6 — Unified Settings & Governance

**What:** `/business/[businessId]/workspace/settings` — profile, MRI, capabilities, audit log.

Files:
```
apps/web/src/app/business/[businessId]/workspace/settings/page.tsx
apps/web/src/components/settings/BusinessProfileCard.tsx
apps/web/src/components/settings/CapabilityReport.tsx
apps/web/src/components/settings/AuditLog.tsx
```

API calls: Existing profile, capability, audit routes.

---

## Event Extensions (5 Additive)

```typescript
"workspace.view.loaded"       // Workspace page rendered — tracks engagement
"timeline.updated"            // New event added to timeline
"approval.completed"          // Decision or recommendation approved/rejected
"automation.status.changed"   // Integration connected/disconnected or tool run
"intelligence.summary.generated" // Intelligence center panel assembled
```

All emitted via existing `DurableEventBus`. No changes to event bus infrastructure.

---

## API Additions (Minimal)

| Method | Route | Backed By |
|--------|-------|-----------|
| `GET` | `/businesses/:id/workspace` | `workspaceService.getWorkspace()` |
| `GET` | `/businesses/:id/approvals` | `workspaceService.getPendingApprovals()` |

Both are thin orchestration over existing repos. No new MCP logic.

---

## Test Plan

| Test Suite | Coverage |
|------------|---------|
| Registry integrity | 5 new registries correctly structured and seeded |
| Workspace assembly | `workspaceService` returns correct snapshot shape |
| Approval queue | Pending decisions + recommendations correctly filtered |
| Timeline ordering | Events appear in correct chronological order |
| Automation center | Integration status correctly reflected |
| Intelligence aggregation | Root causes + optimization + scenarios assembled |
| Multi-tenant isolation | All new routes scoped by orgId |
| Event emission | 5 new events emitted on correct actions |

Target: 193 existing + ~20 new = ~213 tests, all passing.

---

## Architecture Compliance Checklist

- [ ] Zero new platform services duplicating existing capabilities
- [ ] All MCP intelligence reused, not replaced
- [ ] All new registries use existing `createRegistry<T>()` factory
- [ ] All new event types use existing `DurableEventBus`
- [ ] All HTTP routes extract `orgId` from JWT (never request body)
- [ ] All UI states designed: loading (skeleton), empty (CTA), error (fix instructions), success
- [ ] Telemetry emitted for every workspace interaction
- [ ] Domain events for all state changes

---

## Success Definition

BOSS presents every existing backend capability — health, decisions, plans, verifications, timeline, approvals, integrations, intelligence, root causes, scenarios, recommendations — through a single unified executive workspace that a small business owner can navigate in under 60 seconds to understand the full state of their business and take action.
