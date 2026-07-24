# BOSS V3 — MRI (Market Reality Intelligence) Certification

**Date:** 2026-07-24  
**Status:** PASS

---

## MRI Architecture

```
business.created event
    │
    └─ mriSubscriber.handle(event)
          │
          └─ mriService.startMri(businessId, orgId)
                │
                ├─ Create mri_reports row (status: running)
                ├─ Emit mri.started event
                │
                ├─ Phase 1: Business DNA extraction
                │     └─ MCP → claude-sonnet-4-6
                │           Input: business profile (name, industry, employees, revenue,
                │                  hours, services, tools, ai_workforce)
                │           Output: DNA schema (strengths, weaknesses, opportunities, risks,
                │                   core_metrics, competitive_position)
                │
                ├─ Phase 2: Health score calculation
                │     └─ Weighted score across 6 dimensions:
                │           Operations (20%), Finance (20%), Marketing (15%),
                │           Sales (15%), HR (15%), Technology (15%)
                │
                ├─ Phase 3: Alert generation
                │     └─ Issues where dimension score < 40
                │
                ├─ Phase 4: Recommendation ranking
                │     └─ Prioritized actions by impact × effort matrix
                │
                ├─ Update mri_reports row (status: completed, result: {...})
                ├─ Update businesses.health_score + businesses.last_mri_at
                └─ Emit mri.completed event
```

---

## MRI Trigger Points

| Trigger | Implementation | Status |
|---|---|---|
| `business.created` | `JournaledEventBus` subscriber | ✅ |
| Manual re-run | `POST /api/v1/businesses/:id/mri` | ✅ |
| Scheduled (daily) | Cron via `CRON_SECRET` auth | ✅ |

---

## API Routes

| Route | Method | Auth | Status |
|---|---|---|---|
| `/api/v1/businesses/:id/mri` | GET | requireOrgId | ✅ Returns latest MRI report |
| `/api/v1/businesses/:id/mri` | POST | requireOrgId | ✅ Triggers new MRI |
| `/api/v1/businesses/:id/health` | GET | requireOrgId | ✅ Returns health score + alerts |
| `/api/v1/businesses/:id/health-summary` | GET | requireOrgId | ✅ Returns summary for dashboard |

---

## MRI Report Schema

```typescript
interface MriReport {
  id: string;
  businessId: string;
  orgId: string;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt: string | null;
  error: string | null;
  result: {
    dna: BusinessDna;
    healthScore: number;           // 0–100
    healthDimensions: {
      operations: number;
      finance: number;
      marketing: number;
      sales: number;
      hr: number;
      technology: number;
    };
    alerts: Alert[];               // score < 40 dimensions
    recommendations: Recommendation[];
    revenueAtRisk: number;         // estimated from weak dimensions
  } | null;
}
```

---

## Event Journal Integration

| Event | Payload | Status |
|---|---|---|
| `mri.started` | `{ businessId, orgId, mriId }` | ✅ |
| `mri.completed` | `{ businessId, orgId, mriId, healthScore }` | ✅ |
| `mri.failed` | `{ businessId, orgId, mriId, error }` | ✅ |

---

## Error Handling

| Scenario | Behavior |
|---|---|
| LLM timeout | MRI marked `failed`; error recorded; business health unchanged |
| LLM output schema invalid | MRI marked `failed`; detailed error logged |
| Business not found | MRI not started; 404 returned |
| Duplicate MRI running | Second request waits for first; no double-billing |

---

## Async UI Pattern

The MRI runs asynchronously. The workspace page:
1. Shows "MRI in progress" banner while `status === "running"`
2. Polls `/api/v1/businesses/:id/mri` every 5s
3. Renders full MRI results when `status === "completed"`
4. Shows error state with retry CTA when `status === "failed"`

---

## Certification Decision

**PASS.** MRI is triggered correctly by `business.created` event. All four lifecycle phases are implemented. Event journal integration is complete. Error states are handled gracefully. The workspace UI correctly handles all async MRI states.
