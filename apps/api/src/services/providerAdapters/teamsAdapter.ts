import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";



/**
 * Microsoft Teams adapter for `send_message` and `send_notification` capabilities.
 * Credential value: `Bearer <oauth2_access_token>` (Microsoft Identity Platform).
 * Uses Microsoft Graph API to send a channel message. Credential value must include
 * the team ID and channel ID as `Bearer <token>|<teamId>|<channelId>`.
 *
 * If no teamId/channelId is embedded in the credential, falls back to
 * using input.chatId for a direct chat message via /chats/{chatId}/messages.
 */
export function createTeamsAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "teams",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const parts = credential.value.split("|");
      const token = (parts[0] ?? "").startsWith("Bearer ") ? (parts[0] ?? "") : `Bearer ${parts[0] ?? ""}`;
      const teamId = parts[1] ?? String(input.teamId ?? "");
      const channelId = parts[2] ?? String(input.channelId ?? "");
      const chatId = String(input.chatId ?? "");
      const text = String(input.text ?? input.body ?? input.message ?? "");

      const url = teamId && channelId
        ? `https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${channelId}/messages`
        : chatId
          ? `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`
          : null;

      if (!url) {
        return { status: "failed", output: null, errorMessage: "Teams adapter requires teamId+channelId or chatId", errorCode: "INVALID_INPUT", latencyMs: Date.now() - startedAt };
      }

      try {
        const response = await fetchImpl(url, {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ body: { content: text } }),
        });
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode = response.status === 401 || response.status === 403 ? "AUTH_FAILED" : response.status === 429 ? "RATE_LIMITED" : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Teams Graph API returned ${response.status}`, errorCode, latencyMs };
        }
        return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, teams: payload }, errorMessage: null, errorCode: null, latencyMs };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Teams request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
