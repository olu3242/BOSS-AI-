import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";



/**
 * Gmail adapter for the `send_email` capability.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Encodes an RFC 2822 message as base64url and POSTs to the Gmail API.
 */
export function createGmailAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "gmail",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;
      const to = String(input.to ?? "");
      const subject = String(input.subject ?? "");
      const body = String(input.body ?? "");
      const from = String(input.from ?? "me");

      const rfc2822 = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, `Content-Type: text/plain; charset=utf-8`, ``, body].join("\r\n");
      const raw = Buffer.from(rfc2822).toString("base64url");

      try {
        const response = await fetchImpl("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify({ raw }),
        });
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode = response.status === 401 || response.status === 403 ? "AUTH_FAILED" : response.status === 429 ? "RATE_LIMITED" : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Gmail API returned ${response.status}`, errorCode, latencyMs };
        }
        return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, gmail: payload }, errorMessage: null, errorCode: null, latencyMs };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Gmail request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
