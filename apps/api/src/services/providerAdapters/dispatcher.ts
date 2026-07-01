import { executeToolRequestSimulated, type ResolvedTool } from "@boss/mcp";
import { nowIso } from "@boss/shared";
import type { RepositoryContainer } from "../../container.js";
import { createAdapterRegistry } from "./adapterRegistry.js";
import { createCredentialResolver } from "./credentialResolver.js";
import { createCircuitBreaker, type CircuitBreaker } from "./circuitBreaker.js";
import { defaultRetryPolicy, withRetry } from "./retryPolicy.js";
import { isRetryableErrorCode, mapProviderError } from "./errorMapping.js";
import type { ProviderAdapterResult } from "./types.js";

export interface DispatchOutcome {
  status: "succeeded" | "failed";
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  errorCode: string | null;
  attemptCount: number;
  latencyMs: number;
}

const adapterRegistry = createAdapterRegistry();
const circuitBreaker: CircuitBreaker = createCircuitBreaker();

export async function dispatchProviderExecution(
  repos: RepositoryContainer,
  orgId: string,
  businessId: string,
  resolved: ResolvedTool,
  input: Record<string, unknown>,
  toolExecutionId: string
): Promise<DispatchOutcome> {
  const adapter = adapterRegistry.get(resolved.providerKey);

  if (!adapter) {
    const simulated = executeToolRequestSimulated(resolved, input);
    return { ...simulated, errorCode: null, attemptCount: 1, latencyMs: 0 };
  }

  await repos.eventBus.publish({
    type: "tool.provider.resolved",
    payload: { orgId, businessId, providerKey: resolved.providerKey, toolKey: resolved.toolKey },
    occurredAt: nowIso(),
  });

  if (!circuitBreaker.canAttempt(resolved.providerKey)) {
    await repos.eventBus.publish({
      type: "tool.provider.unavailable",
      payload: { orgId, businessId, providerKey: resolved.providerKey, reason: "circuit_open" },
      occurredAt: nowIso(),
    });
    return {
      status: "failed",
      output: null,
      errorMessage: `Provider "${resolved.providerKey}" is temporarily unavailable (circuit open)`,
      errorCode: "PROVIDER_UNAVAILABLE",
      attemptCount: 0,
      latencyMs: 0,
    };
  }

  const credentialResolver = createCredentialResolver(repos, repos.secretStore);
  const credential = await credentialResolver.resolve(orgId, businessId, resolved.providerKey);

  if (!credential) {
    await repos.eventBus.publish({
      type: "tool.provider.unavailable",
      payload: { orgId, businessId, providerKey: resolved.providerKey, reason: "no_credential" },
      occurredAt: nowIso(),
    });
    return {
      status: "failed",
      output: null,
      errorMessage: `No usable credential is available for provider "${resolved.providerKey}"`,
      errorCode: "AUTH_FAILED",
      attemptCount: 0,
      latencyMs: 0,
    };
  }

  await repos.eventBus.publish({
    type: "tool.credentials.resolved",
    payload: { orgId, businessId, providerKey: resolved.providerKey },
    occurredAt: nowIso(),
  });

  await repos.eventBus.publish({
    type: "tool.execution.started",
    payload: { orgId, businessId, providerKey: resolved.providerKey, toolKey: resolved.toolKey },
    occurredAt: nowIso(),
  });

  const { result, attemptCount } = await withRetry<ProviderAdapterResult>(
    defaultRetryPolicy,
    async () => {
      try {
        return await adapter.execute(resolved, input, credential);
      } catch (err) {
        const mapped = mapProviderError(err, resolved.providerKey);
        return { status: "failed" as const, output: null, errorMessage: mapped.message, errorCode: mapped.code, latencyMs: 0 };
      }
    },
    (r) => r.status === "failed" && isRetryableErrorCode(r.errorCode ?? null),
    (attemptNumber, delayMs) => {
      void repos.eventBus.publish({
        type: "tool.retry.scheduled",
        payload: { orgId, businessId, providerKey: resolved.providerKey, attemptNumber, delayMs },
        occurredAt: nowIso(),
      });
    }
  );

  if (result.status === "succeeded") {
    const { closedFromOpen } = circuitBreaker.recordSuccess(resolved.providerKey);
    if (closedFromOpen) {
      await repos.eventBus.publish({
        type: "tool.circuit.closed",
        payload: { orgId, businessId, providerKey: resolved.providerKey },
        occurredAt: nowIso(),
      });
    }
    await repos.eventBus.publish({
      type: "tool.execution.succeeded",
      payload: { orgId, businessId, providerKey: resolved.providerKey, toolKey: resolved.toolKey },
      occurredAt: nowIso(),
    });
  } else {
    const { openedNow } = circuitBreaker.recordFailure(resolved.providerKey);
    if (openedNow) {
      await repos.eventBus.publish({
        type: "tool.circuit.opened",
        payload: { orgId, businessId, providerKey: resolved.providerKey },
        occurredAt: nowIso(),
      });
    }
    await repos.eventBus.publish({
      type: "tool.execution.failed",
      payload: {
        orgId,
        businessId,
        providerKey: resolved.providerKey,
        toolKey: resolved.toolKey,
        errorMessage: result.errorMessage,
        errorCode: result.errorCode,
      },
      occurredAt: nowIso(),
    });
  }

  // Persist provider evidence
  await repos.providerEvidence.create({
    orgId,
    businessId,
    toolExecutionId,
    providerKey: resolved.providerKey,
    toolKey: resolved.toolKey,
    status: result.status,
    latencyMs: result.latencyMs,
    attemptCount,
    errorCode: result.errorCode ?? null,
    responseSnapshot: result.output,
  });

  await repos.eventBus.publish({
    type: "tool.evidence.persisted",
    payload: { orgId, businessId, providerKey: resolved.providerKey, toolKey: resolved.toolKey, status: result.status },
    occurredAt: nowIso(),
  });

  return {
    status: result.status,
    output: result.output,
    errorMessage: result.errorMessage,
    errorCode: result.errorCode ?? null,
    attemptCount,
    latencyMs: result.latencyMs,
  };
}
