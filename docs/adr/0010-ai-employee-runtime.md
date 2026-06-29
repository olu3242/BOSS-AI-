# ADR-0010: AI Employee Runtime — "ai" task handler on Loop, decision logic in MCP

**Status:** accepted
**Date:** 2026-06-29

## Context

Goal 11 required implementing the AI Employee runtime on top of the Loop
Runtime and Tool Fabric. CLAUDE.md's `AIEmployee` contract is broad
(`policies`, `memory`, `lifecycle`, `escalationRules`, etc.), but the only
thing that already existed was `AiEmployeeEntry` in
`packages/registries/src/registries/aiEmployee.ts` — a lightweight,
metadata-only registry entry (`mission`, `responsibilities`,
`capabilities`, `requiredTools`, `kpis`, `permissions`, `escalationRules`,
`lifecycle`). The Loop Runtime's `"ai"` task type was wired to
`notImplementedHandler("ai")` — a stub. `MemoryRecord` existed in the
ontology but had no repository/persistence layer at all.

## Decisions

1. **`decideAiEmployeeAction()` is the brain; it lives in
   `packages/mcp/src/intelligence/aiEmployeeRuntime.ts`.** Given an
   `employeeKey`, `capabilityKey`, `requestedBy`, and `input`, it looks up
   the employee in `aiEmployeeRegistry`, and returns one of two outcomes:
   `{ kind: "execute", toolRequest }` if the employee is `"available"` and
   the capability is in its declared `capabilities` list, or
   `{ kind: "escalate", reason }` otherwise. It performs no I/O and calls
   nothing in Loop or Tool Fabric — purely a deterministic decision over
   registry data, consistent with the same pattern already used by
   `toolFabric.ts`'s `resolveCapability()`.
2. **The `"ai"` task handler (in `apps/api/src/services/
   loopRuntimeService.ts`) is the execution side.** It calls
   `decideAiEmployeeAction()`; on `"execute"` it delegates to
   `toolFabric.requestTool()` (the same Tool Fabric path the `"tool"` task
   type already uses) — the AI employee runtime never re-implements
   capability resolution or provider execution, it only decides whether an
   employee may invoke a given capability. On `"escalate"` it publishes
   `ai_employee.escalation.triggered` and returns an `errorMessage` with no
   output, leaving the workflow's retry/dead-letter handling unchanged.
3. **Memory got a real persistence layer.** `MemoryRecord`
   (`packages/types/src/ontology.ts`) gained `businessId`, `createdAt`,
   `updatedAt` fields (it previously had neither, despite being
   `TenantScoped`). A new `MemoryRecordRepository` was added to
   `packages/db` (in-memory + Postgres, migration `0011_ai_employee_memory.sql`,
   table `memory_records` with a `(org_id, business_id, owner_type,
   owner_id, key)` uniqueness constraint) and wired onto
   `RepositoryContainer.memoryRecords`. Every successful "ai" task
   execution upserts a `last_execution:<capabilityKey>` memory record keyed
   by `(orgId, businessId, "agent", employeeKey)`.
4. **Canonical events**: `ai_employee.task.completed`,
   `ai_employee.task.failed`, `ai_employee.escalation.triggered` — same
   `{context}.{entity}.{verb}` convention as every other domain event.
5. **No new scheduling, no AI inference (LLM calls).** Per TD-007, MCP's
   intelligence stays deterministic rule-based logic; wiring an actual
   Claude API call into an AI employee's task execution is explicitly
   deferred — this ADR only makes the existing `"ai"` task type
   *functional* (resolves a registered employee's permission to act),
   not *generative*.

## Consequences

- All seven seeded `general-smb` AI employee archetypes have
  `lifecycle: "draft"`, so every real "ai" task against them will
  currently escalate rather than execute — this is correct behavior (draft
  employees should not autonomously act) but means no seeded employee can
  exercise the "execute" path until a later goal promotes one to
  `"available"`.
- `decideAiEmployeeAction()` throws `AiEmployeeNotFoundError` for an
  unknown `employeeKey`; the `"ai"` handler catches this (and any other
  exception) to honor the Loop Runtime's handler-never-throws contract
  (established in ADR-0009).

## Alternatives considered

- Giving task handlers direct repository access so the "ai" handler could
  read employee state without going through MCP. Rejected: handlers
  intentionally receive only `Record<string, unknown>` input — granting
  one handler repository access would create an inconsistent execution
  contract across task types.
