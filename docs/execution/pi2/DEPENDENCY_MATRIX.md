# PI-2 Dependency Matrix

Date: 2026-06-27

| Dependency | Classification | Integration decision |
| --- | --- | --- |
| Identity | Extension | Reuse `authorizeRequest`; add capability-plan actions only |
| Organizations | No Change | Every plan and execution remains `org_id` scoped |
| RBAC | Extension | Add read, manage, approve and execute permissions |
| Runtime | Adapter | Resolver emits an execution command; Loop remains sole executor |
| Queue | Adapter | Submit idempotent plan execution jobs through durable job store |
| Scheduler | No Change for MVP | Scheduled activation is deferred |
| Agent Registry | No Change | Resolve agent IDs and versions; never copy metadata |
| Workflow Registry | Extension | Add compatibility metadata only if proven necessary |
| Automation Registry | No Change | Resolve stable IDs; definitions remain registry-owned |
| Trigger Registry | No Change for MVP | Manual approval is the initial trigger |
| Event Registry | Extension | Register `business.capability.*` contracts |
| Marketplace | No Change | Deferred as P2 |
| Analytics | Extension | Map plan outcomes to existing KPI IDs and TTFBV |
| Learning | No Change | Not implemented; deferred |
| Notifications | Adapter later | In-app success/failure is P0 but runtime is absent |
| Observability | Extension | Reuse trace context; add plan resolution/execution metrics |
| Security | Extension | Central policy checks before approve/execute |
| Database | Migration | Add tenant plan, version, reference, approval, history and KPI tables |
| Frontend | Extension | Add one review/approve/result journey; no visual builder |
| Administration | No Change | Deferred |
| Certification | Extension | Add reference, lifecycle, tenant and execution checks |

## Dependency Direction

```text
web -> api application service -> business-outcome domain
                               -> mcp candidate resolver
                               -> db repository adapter
                               -> registry query ports
                               -> runtime submission port -> loop
```

Forbidden directions:

- Business-outcome domain must not import API, DB, web or Loop.
- MCP must not import Loop.
- Loop must not import the business-outcome domain.
- Registries must not import tenant repositories.
- Industry packs must remain declarative.

## Classification Totals

- No Change: 8
- Extension: 9
- Adapter: 3
- Migration: 1
- Refactor: 0

No rewrite or destructive migration is justified.
