# BOSS V3 — Mission Control Certification

**Date:** 2026-07-24  
**Status:** PASS

---

## Mission Control Architecture

```
GET /business/:businessId/mission-control (Server Component)
    │
    ├─ requireActiveTenant("/auth/sign-in")
    │     └─ Verifies session + resolves org
    │
    ├─ apiClient.getMissionControlSnapshot(orgId, businessId)
    │     └─ GET /api/v1/businesses/:id/mission-control
    │           └─ missionControlController.getSnapshot(orgId, businessId)
    │                 ├─ Verify business belongs to org
    │                 ├─ Load active workflow instances
    │                 ├─ Load event timeline (last 50 events)
    │                 └─ Return { workflows, timeline }
    │
    └─ Renders: workflows list + timeline + empty state
```

---

## API Route

| Route | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/businesses/:id/mission-control` | GET | requireOrgId | ✅ |

---

## Data Model

```typescript
interface MissionControlSnapshot {
  workflows: WorkflowSummary[];
  timeline: TimelineEntry[];
}

interface WorkflowSummary {
  id: string;
  workflowKey: string;
  state: "pending" | "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
}

interface TimelineEntry {
  id: string;
  occurredAt: string;
  description: string;
  eventType: string;
  metadata: Record<string, unknown>;
}
```

---

## UI States

| State | Component | Behavior |
|---|---|---|
| No workflows, no timeline | EmptyState | "Run a Business MRI and approve a recommendation to see workflows here." |
| Workflows present | Card list | Workflow key + state Badge |
| Timeline present | Card list | Timestamp + description |
| API error | Inline error message | Shows error.message from ApiClientError |

---

## Content Verified

| Widget | Source | Status |
|---|---|---|
| Workflows | `workflow_instances` table, filtered by org + business | ✅ |
| Timeline | `event_journal` table, filtered by org + business | ✅ |
| Empty state | `hasActivity` check | ✅ |

---

## Integration with Business Lifecycle

Mission Control becomes populated when:
1. Business MRI completes → `mri.completed` event appears in timeline
2. User approves a recommendation → `recommendation.approved` event + workflow created
3. Workflow executes → workflow instance state transitions in timeline

---

## Certification Decision

**PASS.** Mission Control page correctly renders business execution history. All UI states are handled. Auth and tenant isolation are enforced. The page shows real data from the event journal and workflow instances tables.

Note: Mission Control will show an empty state for a freshly created business until the first MRI completes and a recommendation is approved. This is correct behavior.
