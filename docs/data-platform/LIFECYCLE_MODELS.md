# BOSS Lifecycle Models

> Version: 1.0.0 | State machines for all stateful entities

---

## Lead Lifecycle

```
new ──────────► contacted ──────────► qualified ──────────► converted
 │                  │                     │
 │                  │                     └──────────────────► lost
 │                  │
 └──────────────────┴──────────────────────────────────────► lost
```

| Transition | Trigger | Event Emitted |
|-----------|---------|--------------|
| → contacted | Manual update / AI action | — |
| → qualified | `/qualify` endpoint | `lead.qualified` |
| → converted | `/convert` endpoint | `lead.converted` |
| → lost | `/lost` endpoint | — |

**Terminal states**: `converted`, `lost`

---

## Customer Lifecycle

```
prospect ──► active ──► at_risk ──► churned
                 ▲          │
                 └──────────┘ (re-engaged)
```

Transitions driven by AI health score and interaction patterns. No hard endpoint — status is updated by the Customer Success AI or manually.

---

## Job Lifecycle

```
draft ──► scheduled ──► in_progress ──► completed
                │             │
                └─────────────┴──────► on_hold
                                           │
                                    ◄──────┘ (resumed)
                       cancelled ◄── (any non-terminal)
```

| Transition | Trigger |
|-----------|---------|
| draft → scheduled | Explicit scheduling |
| scheduled → in_progress | Worker starts job |
| in_progress → on_hold | Manual hold |
| on_hold → in_progress | Resume |
| any → cancelled | Manual cancellation |
| in_progress → completed | Job completion |

**Terminal states**: `completed`, `cancelled`

---

## Appointment Lifecycle

```
scheduled ──► confirmed ──► in_progress ──► completed
     │             │
     └─────────────┴──────► cancelled
     │
     └──────────────────────► no_show
```

**Terminal states**: `completed`, `cancelled`, `no_show`

---

## Invoice Lifecycle

```
draft ──► sent ──► viewed ──► paid
  │          │
  │          └──────────────► overdue ──► paid
  │                                  │
  └──────────────────────────────────┴──► cancelled
                                          │
                                      refunded (post-paid)
```

| Transition | Trigger | Side Effect |
|-----------|---------|-------------|
| draft → sent | Send action | Email to customer |
| sent → viewed | Webhook or tracking pixel | — |
| sent/viewed → paid | Payment recorded | `customer.total_revenue` updated |
| sent/viewed → overdue | Due date passed (cron) | Notification sent |
| overdue → paid | Late payment recorded | — |
| paid → refunded | Refund recorded | `customer.total_revenue` adjusted |
| any → cancelled | Manual cancellation | — |

**Terminal states**: `paid`, `cancelled`, `refunded`

---

## Payment Lifecycle

```
pending ──► completed
    │
    └──────► failed
    │
    └──────► refunded (from completed)
```

**Terminal states**: `completed`, `failed`, `refunded`

---

## Constraint Lifecycle

```
active ──► monitoring ──► resolved
  │              │
  └──────────────┴──────► dismissed
```

| Transition | Trigger |
|-----------|---------|
| → monitoring | Status update indicating watching |
| → resolved | Confirmed resolution |
| → dismissed | User/AI dismissal |

All transitions logged to `constraint_history`. `version` field incremented on each status change.

---

## Recommendation Lifecycle

```
proposed ──► approved ──► in_progress ──► completed
    │            │
    └────────────┴──────► rejected
    │
    └──────────────────► dismissed
```

| Transition | Endpoint | Event |
|-----------|---------|-------|
| proposed → approved | `/approve` | `business.recommendation.approved`, `workflow.generated` |
| proposed → dismissed | `/dismiss` | `recommendation_dismissed` |
| proposed → rejected | Admin action | — |
| approved → in_progress | Workflow starts | — |
| in_progress → completed | Workflow completes | — |

**Terminal states**: `completed`, `rejected`, `dismissed`

---

## Business Decision Lifecycle

```
draft ──► pending_review ──► approved ──► scheduled ──► executing ──► completed
  │             │                │
  │             └────────────────┴──────► rejected
  │
  └──────────────────────────────────────────────────────────────► archived
```

| Transition | Endpoint | Event |
|-----------|---------|-------|
| draft → pending_review | `/generate` | `business.decision.generated` |
| pending_review → approved | `/approve` | `decision.approved` |
| pending_review → rejected | `/reject` | `decision.rejected` |
| approved → scheduled | `/schedule` | `decision.scheduled` |
| completed → measured | `/measure` | `decision.measured` |
| any → archived | `/archive` | `decision.archived` |

---

## Workflow Execution Lifecycle

```
pending ──► running ──► completed
   │            │
   │            └──────► failed ──► (retry → pending)
   │            │
   │            └──────► waiting_approval ──► approved → running
   │                                      └──► rejected → failed
   └──────────────────────────────────────────────────► cancelled
```

---

## Scheduler Job Lifecycle

```
pending ──► running ──► completed (one-shot: max_runs=1)
   │            │
   │            └──────► failed
   │            │
   │            └──────► pending (recurring: reschedule)
   └──────────────────► cancelled
```

**For recurring jobs**: After each successful run, state resets to `pending` with updated `run_at`.

---

## Business MRI Lifecycle

```
in_progress ──► completed
```

- MRI starts when `/mri/start` is called → state `in_progress`
- Sections and questions are pre-populated from question registry
- Each response recorded independently via `/mri/:mriId/respond`
- MRI completed via `/mri/:mriId/complete` → state `completed` → triggers DNA generation

---

## Customer Review Lifecycle

```
pending ──► published ──► hidden
   │              │
   └──────────────┴──────► flagged ──► hidden
                                   └──► published (reviewed)
```

---

## Organization Status Lifecycle

```
trial ──► active ──► suspended
  │
  └──────────────────────────► suspended (trial expired)
```

Transitions driven by billing system. `suspended` prevents login and API access.

---

## Business Health Score Lifecycle

Not a state machine — recalculated on demand or via BTE cycle:

```
Trigger: /health/generate OR BTE cron
  │
  ▼
DiagnosticEngine.calculateHealth()
  │
  ▼
New business_health record created (immutable snapshot)
  │
  ▼
business_health_dimensions populated
  │
  ▼
business.health.calculated event emitted
```

Each calculation creates a new record. History is queryable. No state transitions — append-only.
