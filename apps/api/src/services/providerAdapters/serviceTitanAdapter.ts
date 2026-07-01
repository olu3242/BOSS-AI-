import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * ServiceTitan adapter for the `create_job` capability.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Input fields:
 *   tenantId (string) — ServiceTitan tenant ID
 *   customerId (number) — ST customer ID
 *   locationId (number) — ST location ID
 *   jobTypeId (number) — ST job type ID
 *   businessUnitId (number) — ST business unit ID
 *   scheduledStart (ISO datetime string)
 *   scheduledEnd (ISO datetime string)
 *   summary? (string)
 */
export function createServiceTitanAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "servicetitan",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;

      const tenantId = String(input.tenantId ?? "");
      if (!tenantId) {
        return { status: "failed", output: null, errorMessage: "tenantId is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const customerId = Number(input.customerId);
      const locationId = Number(input.locationId);
      const jobTypeId = Number(input.jobTypeId);
      const businessUnitId = Number(input.businessUnitId);
      const scheduledStart = String(input.scheduledStart ?? "");
      const scheduledEnd = String(input.scheduledEnd ?? "");
      const summary = input.summary != null ? String(input.summary) : null;

      const body: Record<string, unknown> = {
        customerId,
        locationId,
        jobTypeId,
        businessUnitId,
        scheduledStart,
        scheduledEnd,
      };
      if (summary) body.summary = summary;

      try {
        const response = await fetchImpl(
          `https://api.servicetitan.io/dispatch/v2/tenant/${tenantId}/jobs`,
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
              "ST-App-Key": process.env.SERVICETITAN_APP_KEY ?? "",
            },
            body: JSON.stringify(body),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 || response.status === 403 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `ServiceTitan API returned ${response.status}`, errorCode, latencyMs };
        }
        return {
          status: "succeeded",
          output: {
            toolKey: resolved.toolKey,
            providerKey: resolved.providerKey,
            jobId: payload?.id,
            jobNumber: payload?.jobNumber,
            status: payload?.status,
          },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "ServiceTitan request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
