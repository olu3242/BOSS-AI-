# ADR-0006: Business Tool & Integration Fabric — capability contracts, registry-driven provider resolution, credentials as references only, simulated execution adapter

**Status:** accepted
**Date:** 2026-06-29

## Context

Goal 8 builds the abstraction layer between AI Employees/Loop Runtime and
external systems (Gmail, Microsoft 365, Twilio, HubSpot, QuickBooks,
Google Calendar, Slack, etc.). No caller — present or future — may talk to
a provider directly; every request goes through a named Capability
Contract (`send_email`, `schedule_appointment`, `create_invoice`, ...) and
the Tool Fabric resolves which concrete Tool + connected Provider
satisfies it. This is a prerequisite for Goal 9 (AI Workforce), which
explicitly depends on these capability contracts to avoid AI Employees
ever touching a provider SDK directly.

Four architectural questions needed resolving: (1) how a capability
request becomes a concrete provider call without hardcoding provider
choice, (2) how credentials are stored without ever persisting raw
secrets, (3) how permission/approval is enforced per tool+role, (4) how
execution can be observable (audited, health-tracked) before any real
provider HTTP client exists.

## Decisions

1. **Three declarative registries, not a single Tool Definition.**
   `capabilityContractRegistry`, `providerDefinitionRegistry`, and
   `toolDefinitionRegistry` (`packages/registries/src/registries/`) are
   kept separate: a Capability is provider-agnostic (`send_email`), a
   Provider declares which capabilities it supports (`gmail` supports
   `send_email`), and a Tool is the join — capability + the providers that
   can fulfill it + required permissions + retry/timeout/rate-limit/audit
   policy. This mirrors the spec's explicit separation ("Every AI employee
   uses capabilities. Never providers" / "Everything provider agnostic").
2. **`resolveCapability()` intersects supported providers with currently
   connected integrations — never defaults to an unconnected provider.**
   `packages/mcp/src/intelligence/toolFabric.ts` looks up the Tool for a
   capability, intersects `tool.supportedProviderKeys` with the business's
   `connected` `IntegrationAccount`s, and throws `NoConnectedProviderError`
   if none match. Permission is checked per `(toolKey, roleKey)`, defaulting
   to `"approval_required"` when no explicit `PermissionPolicy` row exists
   — the safe default — and throwing `PermissionDeniedError` when a policy
   explicitly disallows it.
3. **Credentials are reference pointers only — `credential_references.secret_ref`
   never stores a raw secret.** Per the spec's explicit "Credentials
   (references only)" requirement, the table and `CredentialReference`
   type only carry an opaque pointer into an external secret store; no
   `CredentialManager` integration with an actual secret store is
   implemented in this goal (tracked as tech debt).
4. **`executeToolRequestSimulated()` is the only Execution Adapter for now.**
   Per Law 1 (MCP owns intelligence, never execution) and the fact that no
   HTTP client exists in `@boss/mcp`, the adapter returns a deterministic
   `{ status: "succeeded", output: { simulated: true, ... } }` without any
   network call. This gives the rest of the fabric (audit records,
   `ToolExecution` rows, `ProviderHealth` upserts) something concrete to
   record against until a future Loop Runtime adapter performs the live
   provider call — execution itself is explicitly out of scope for MCP.

## Consequences

- Same dual repository adapter pattern (Postgres + in-memory) as every
  prior goal, extended to: `IntegrationAccountRepository`,
  `PermissionPolicyRepository`, `ToolExecutionRepository` (also owns
  `tool_audit_history`), `ProviderHealthRepository`.
- `ToolAuditRecord` and `ProviderHealth` extend `TenantScoped` only, not
  `Timestamped` — their tables have no `deleted_at` column (audit history
  is append-only; health is an upserted snapshot, not soft-deletable).
- `packages/db/migrations/0008_tool_integration_fabric.sql` and
  `0009_seed_tool_fabric.sql` were applied and validated against a live
  local Postgres instance (`boss_dev`): 9 new tables, 12 seeded
  capabilities, 19 seeded providers, 12 seeded tools — row counts verified
  to match `industry-packs/general-smb/src/data/toolFabric.ts` exactly.
- `apps/api/src/services/toolFabricService.ts` exposes connect/disconnect
  integration, set/list permission policies, `requestTool` (resolve →
  create pending execution → audit `tool.requested` → execute simulated →
  update status → audit `tool.<status>` → upsert provider health), list
  executions/audit/health — no business reasoning, purely orchestration
  over the MCP resolver and DB repositories.
- No UI (Integration Center, Connection Wizard, etc.) is implemented in
  this goal, consistent with every prior goal's deferral of `apps/web`
  pages.
- AI Employees are explicitly NOT implemented in this goal — Goal 9
  depends on these capability contracts but is sequenced after.

## Alternatives Considered

- A single flat `Tool` model encoding provider + capability together
  (no separate Provider/Capability registries): rejected — would make
  "add a new provider for an existing capability" require duplicating
  every tool's retry/timeout/permission policy instead of just adding one
  provider row, and would violate "Every AI employee uses capabilities.
  Never providers."
- Storing raw provider credentials inline on `IntegrationAccount`:
  rejected outright per the spec's explicit "Credentials (references
  only)" requirement — security boundary, not a convenience tradeoff.
- Building a real HTTP execution adapter now (e.g. an actual Gmail API
  call): rejected — Law 1 forbids MCP from executing anything, and no
  Loop Runtime adapter layer exists yet to own that responsibility.
