# ADR 0016 — Super Batch A: Production Execution Platform (Goals 16A + 16B + 16C)

**Date:** 2026-06-30  
**Status:** Accepted

## Context

Goal 16 (ADR 0015) built the adapter dispatch pipeline with Twilio as the sole
real provider. The user regrouped the remaining execution-layer work into a single
"Super Batch A" to avoid integrating partially-working adapter infrastructure twice.

## Decision

### Goal 16A — Provider Adapter Foundation (extensions)

**What was added:**
- `ProviderErrorCode` enum + `mapProviderError` helper (`errorMapping.ts`) — standardized error classification across all adapters
- `isRetryableErrorCode` — drives retry decision in `dispatcher.ts` (replacing ad-hoc string comparisons)
- `mapProviderError` now wraps `adapter.execute()` calls in the dispatcher so uncaught adapter throws are normalized to `ProviderAdapterResult`
- `ProviderEvidence` type added to `packages/types/src/ontology.ts`
- `ProviderEvidenceRepository` interface + postgres + in-memory implementations
- Migration `0013_provider_evidence.sql`
- `DispatchOutcome.errorCode` field propagated through dispatcher → toolFabricService → ToolExecution telemetry
- `toolExecutionId` now passed into `dispatchProviderExecution` so evidence records are linked

**What was NOT added (deferred):**
- `ExecutionContext` (defined, then removed — threading it through all adapter signatures is a larger API change deferred to a future pass when distributed tracing is wired in)
- Adapter Factory pattern as a distinct class — the existing `createAdapterRegistry()` function already serves this purpose; a formal `AdapterFactory` class adds no value

### Goal 16B — Secret Vault

**What was built:**
- `SecretStore` interface (`apps/api/src/services/secretVault/types.ts`): `get`, `put`, `rotate`, `delete`, `audit`
- `EnvSecretStore` — reads `process.env[ref.key]`, read-only, audit-logged per call; dev/test placeholder
- `EncryptedInMemorySecretStore` — AES-256-GCM encrypt-at-rest, per-`orgId` tenant isolation, rotation support, full audit trail; key from `SECRET_VAULT_KEY` env var (falls back to test key outside production)
- `CredentialResolver` rewritten to use `SecretStore.get(...)` instead of direct `process.env` access
- `tool.credentials.accessed` event emitted on each credential resolution
- `SecretStore` added as `repos.secretStore` field on `RepositoryContainer`; both postgres and in-memory containers default to `EnvSecretStore`

**Explicitly NOT production-grade:**
- No external KMS (Vault, AWS Secrets Manager) driver — that is the next resolution of TD-014
- No secret TTL enforcement, cross-process sharing, or HA

### Goal 16C — Production Adapters

Six providers wired with real HTTP adapters (injectable `fetch` for testability):

| providerKey    | authType | capability                     | API endpoint                            |
|----------------|----------|--------------------------------|-----------------------------------------|
| twilio         | api_key  | send_sms                       | Twilio REST Messages.json               |
| messagebird    | api_key  | send_sms                       | MessageBird REST /messages              |
| gmail          | oauth2   | send_email                     | Gmail API /users/me/messages/send       |
| microsoft365   | oauth2   | send_email                     | Microsoft Graph /me/sendMail            |
| slack          | oauth2   | send_message, send_notification | Slack Web API chat.postMessage          |
| teams          | oauth2   | send_message, send_notification | Microsoft Graph /teams/*/messages       |

Remaining 13 providers (smtp, google_calendar, outlook_calendar, hubspot, salesforce,
zoho, quickbooks, xero, freshbooks, google_drive, dropbox, onedrive, whatsapp)
continue to use the simulated fallback.

## Test coverage

13 test files, 46 tests:
- `secretVaultFlow.test.ts` — 9 tests (EnvSecretStore + EncryptedInMemorySecretStore)
- `productionAdaptersFlow.test.ts` — 9 tests (Gmail, Slack, M365, Teams, MessageBird)
- `providerAdapterFlow.test.ts` — 9 tests (Twilio + circuit-breaker + retry, from Goal 16)
- All 28 pre-existing tests continue to pass

## Consequences

- TD-013 further narrowed: 6 of 19 registered providers now have real adapters
- TD-014 partially resolved: SecretStore abstraction exists with two implementations; real KMS backing still pending
- `tool_executions.audit_log` → `provider_evidence` records are now emitted for all real-adapter executions
- Tests that previously connected `gmail` have been updated to connect `smtp` (simulated-path provider) to avoid requiring real credentials in unit tests
