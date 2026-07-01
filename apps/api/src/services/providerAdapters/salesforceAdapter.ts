import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Salesforce adapter for the `create_opportunity` capability.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Input fields: instanceUrl (e.g. https://myorg.salesforce.com), name, accountId,
 *               amount? (number), closeDate (YYYY-MM-DD), stageName? (default "Prospecting"), description?
 * Uses the Salesforce REST API v58.0.
 */
export function createSalesforceAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "salesforce",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;

      const instanceUrl = String(input.instanceUrl ?? "").replace(/\/$/, "");
      if (!instanceUrl) {
        return { status: "failed", output: null, errorMessage: "instanceUrl (Salesforce instance URL) is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const name = String(input.name ?? "");
      const accountId = String(input.accountId ?? "");
      const amount = input.amount != null ? Number(input.amount) : undefined;
      const closeDate = String(input.closeDate ?? "");
      const stageName = String(input.stageName ?? "Prospecting");
      const description = input.description != null ? String(input.description) : undefined;

      const opportunityBody: Record<string, unknown> = {
        Name: name,
        AccountId: accountId,
        Amount: amount,
        CloseDate: closeDate,
        StageName: stageName,
        Description: description,
      };

      try {
        const response = await fetchImpl(
          `${instanceUrl}/services/data/v58.0/sobjects/Opportunity/`,
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(opportunityBody),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Salesforce API returned ${response.status}`, errorCode, latencyMs };
        }
        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, opportunityId: payload?.id, success: payload?.success },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Salesforce request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
