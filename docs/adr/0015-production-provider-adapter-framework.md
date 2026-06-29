# ADR 0015 — Production Provider Adapter Framework (Goal 16)

**Date:** 2026-06-29  
**Status:** Accepted

## Context

Goal 8 built the Tool Fabric — capability resolution, permission enforcement, integration account management,
audit logging, and event emission — but every provider call used `executeToolRequestSimulated()`, a deterministic
stub returning `{ simulated: true, ... }`. TD-013 tracked this as the blocking gap preventing any real provider
action.

Goal 16 replaces the simulated execution path with a production-ready dispatch pipeline while preserving
the existing Tool Fabric seam exactly.

## Decision

### Reused (untouched)

- `@boss/mcp` `resolveCapability`, `executeToolRequestSimulated` (retained as the fallback for unregistered providers)
- `ToolExecutionRepository`, `IntegrationAccountRepository`, `ProviderHealthRepository` interfaces and postgres/in-memory implementations
- `EventBus.publish` and all existing event types (`tool.execution.requested`, `tool.execution.${status}`)
- `toolFabricService.requestTool()` outer flow (audit records, event publication, health upsert)
- Provider and tool definition registries in `@boss/registries`

### Extended

- `ToolExecution` ontology type: added `attemptCount: number` and `latencyMs: number | null`
- `ToolExecutionRepository.create` parameter type: excludes `attemptCount`/`latencyMs` — repos default `1`/`null`
- `ToolExecutionRepository.updateStatus`: new optional `meta` parameter persists attempt count and latency
- Migration `0012_tool_execution_telemetry.sql`: adds `attempt_count`/`latency_ms` columns to `tool_executions`
- `IntegrationAccountRepository.findCredentialByAccount`: was missing from interface/implementations; added to enable credential lookup

### New modules (`apps/api/src/services/providerAdapters/`)

| File | Role |
|------|------|
| `types.ts` | `ProviderAdapter` interface, `ResolvedCredential`, `ProviderAdapterResult`, `CredentialUnavailableError` |
| `credentialResolver.ts` | **Placeholder** env-var resolver (see TD-014 / Goal 17) |
| `retryPolicy.ts` | `withRetry` — exponential backoff, injectable sleep for tests |
| `circuitBreaker.ts` | Per-provider in-process circuit breaker (closed/open/half-open states) |
| `twilioSmsAdapter.ts` | Real Twilio REST API client for `send_sms` (injectable fetch for tests) |
| `adapterRegistry.ts` | Maps `providerKey -> ProviderAdapter`; only providers from `@boss/registries` |
| `dispatcher.ts` | Combines registry lookup, circuit-breaker gate, credential resolution, retry, event emission |
| `index.ts` | Barrel export |

### Event additions (emitted from `dispatcher.ts`)

`tool.provider.resolved`, `tool.credentials.resolved`, `tool.execution.started`,
`tool.execution.succeeded`, `tool.execution.failed`, `tool.provider.unavailable`,
`tool.retry.scheduled`, `tool.circuit.opened`, `tool.circuit.closed`

All are additive; the existing generic pair (`tool.execution.requested` / `tool.execution.${status}`)
continues to be emitted from `toolFabricService`.

## Provider selection

Only one real adapter was wired: **Twilio** (`send_sms`, `authType: "api_key"`). All 15 OAuth2 providers
and the 3 remaining `api_key`/`basic` providers (messagebird, whatsapp, smtp) retain the simulated fallback.

Rationale: Twilio is the only provider where (a) a single string credential suffices
(no OAuth dance), (b) a registered `tool_send_sms` tool definition already exists end-to-end,
and (c) a real HTTP call can be verified by injecting a `fetch` stub in tests without any auth infrastructure.

Generic registry-driven HTTP dispatch is deliberately deferred — provider/tool registry entries
carry `authType` only; they lack endpoint URLs and HTTP method metadata required for a generic adapter.

## Credential resolution

`CredentialResolver` reads `process.env[secretRef]`. This is a **documentation-only placeholder** —
it resolves to `null` (returning a `failed` execution) for any provider whose `secretRef` value is not
present as an environment variable. No plaintext credentials are stored in the database. Real secret-store
integration (Vault, AWS Secrets Manager, encryption at rest, rotation, versioning, tenant isolation)
is deferred to Goal 17 (TD-014).

## Alternatives considered

- **Modify `@boss/mcp`'s `executeToolRequestSimulated`** — rejected: that function lives in the intelligence
  package; real I/O belongs in the execution layer (`apps/api`), consistent with Law 1.
- **New `tool_execution_attempts` table** — rejected: `attempt_count`/`latency_ms` columns on the existing
  `tool_executions` table are sufficient for Goal 16's telemetry requirements; a dedicated attempts table
  is deferred to a future goal if per-attempt granularity becomes necessary.
- **Wire all 4 non-oauth2 providers** — rejected: messagebird/whatsapp/smtp each have additional
  structural differences (smtp requires MIME/connection-pool knowledge, messagebird/whatsapp require
  endpoint-specific research) that would extend Goal 16 well beyond a single increment.

## Consequences

- TD-013 is **narrowed**: Twilio has a real adapter; the other 18 providers remain simulated.
- TD-014 remains open: the env-var resolver is intentionally underpowered.
- Circuit breaker and retry are single-process, in-memory — they do not survive restarts and are not
  distributed across workers. Distributed fault-tolerance is out of scope until Goal 18 (scheduler/workers).
