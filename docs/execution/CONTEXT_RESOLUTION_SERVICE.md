# Context Resolution Service

## Contract

`ContextResolutionService` is the canonical business-context read API. It
supports:

| Context | Semantic entity/view |
| --- | --- |
| Organization | `organization` |
| Department | `department[]` |
| Team | `team[]` |
| Customer | `customer[]` |
| Vendor | `vendor[]` |
| Product | `product[]` |
| Project | `project[]` |
| Workflow | `workflow[]` |
| Automation | `automation[]` |
| AI Execution | `ai_agent[]` |
| Executive | registered `executive` view |

Every request includes `orgId`, `businessId`, execution context, and an
optional graph version. Tenant identity must match the execution context.

## Resolution Flow

```text
request
  -> open version-pinned Graph Runtime session
  -> resolve matching Business Context version
  -> map graph infrastructure to semantic contracts
  -> memoize immutable Semantic Snapshot
  -> filter requested entity context
  -> emit and audit business.context.resolved
```

Collections retain stable semantic-ID ordering. Unknown tenants, draft graphs,
missing source-context versions, and missing organization entities fail
closed.

## Consumer Integration

Consumers receive semantic entities or views. They do not receive traversal
services or persistence contracts. The API composition root exposes one
context resolver backed by the same BSL instance used by execution guards.
