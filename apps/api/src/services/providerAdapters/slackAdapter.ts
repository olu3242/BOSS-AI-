import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";



/**
 * Slack adapter for `send_message` and `send_notification` capabilities.
 * Credential value: Slack Bot OAuth token (begins with `xoxb-`).
 * Uses chat.postMessage.
 */
export function createSlackAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "slack",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;
      const channel = String(input.channel ?? input.to ?? "");
      const text = String(input.text ?? input.body ?? input.message ?? "");

      try {
        const response = await fetchImpl("https://slack.com/api/chat.postMessage", {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ channel, text }),
        });
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          return { status: "failed", output: payload, errorMessage: `Slack API returned ${response.status}`, errorCode: "PROVIDER_UNAVAILABLE", latencyMs };
        }
        if (payload && payload.ok === false) {
          const slackError = String(payload.error ?? "unknown");
          const errorCode = slackError === "token_revoked" || slackError === "not_authed" ? "AUTH_FAILED" : slackError === "ratelimited" ? "RATE_LIMITED" : "INVALID_INPUT";
          return { status: "failed", output: payload, errorMessage: `Slack error: ${slackError}`, errorCode, latencyMs };
        }
        return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, slack: payload }, errorMessage: null, errorCode: null, latencyMs };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Slack request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
