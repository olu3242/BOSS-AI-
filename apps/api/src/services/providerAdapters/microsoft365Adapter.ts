import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";



/**
 * Microsoft 365 adapter for the `send_email` capability.
 * Credential value: `Bearer <oauth2_access_token>` from Microsoft Identity Platform.
 * Uses Microsoft Graph API sendMail endpoint.
 */
export function createMicrosoft365Adapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "microsoft365",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;
      const to = String(input.to ?? "");
      const subject = String(input.subject ?? "");
      const body = String(input.body ?? "");

      const payload = {
        message: {
          subject,
          body: { contentType: "Text", content: body },
          toRecipients: [{ emailAddress: { address: to } }],
        },
      };

      try {
        const response = await fetchImpl("https://graph.microsoft.com/v1.0/me/sendMail", {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const latencyMs = Date.now() - startedAt;
        if (response.status === 202) {
          return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey }, errorMessage: null, errorCode: null, latencyMs };
        }
        const responsePayload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        const errorCode = response.status === 401 || response.status === 403 ? "AUTH_FAILED" : response.status === 429 ? "RATE_LIMITED" : "PROVIDER_UNAVAILABLE";
        return { status: "failed", output: responsePayload, errorMessage: `Microsoft Graph returned ${response.status}`, errorCode, latencyMs };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Microsoft365 request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
