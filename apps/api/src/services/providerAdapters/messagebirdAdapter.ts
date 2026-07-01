import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";



/**
 * MessageBird adapter for the `send_sms` capability.
 * authType: api_key — credential value is the MessageBird API key.
 */
export function createMessageBirdAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "messagebird",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const to = String(input.to ?? "");
      const originator = String(input.from ?? "BOSS");
      const body = String(input.body ?? "");

      try {
        const response = await fetchImpl("https://rest.messagebird.com/messages", {
          method: "POST",
          headers: {
            Authorization: `AccessKey ${credential.value}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipients: [to], originator, body }),
        });
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode = response.status === 401 ? "AUTH_FAILED" : response.status === 422 ? "INVALID_INPUT" : response.status === 429 ? "RATE_LIMITED" : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `MessageBird API returned ${response.status}`, errorCode, latencyMs };
        }
        return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, messagebird: payload }, errorMessage: null, errorCode: null, latencyMs };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "MessageBird request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
