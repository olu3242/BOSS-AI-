import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

/**
 * WhatsApp Business Cloud API adapter for the send_message capability.
 * Credential format: phoneNumberId:accessToken
 */
export function createWhatsAppAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "whatsapp",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();

      const [phoneNumberId, accessToken] = credential.value.split(":");
      if (!phoneNumberId || !accessToken) {
        return { status: "failed", output: null, errorMessage: "WhatsApp credential must be formatted as phoneNumberId:accessToken", latencyMs: Date.now() - startedAt };
      }

      const to = String(input.to ?? "").replace(/\D/g, "");
      const body = String(input.body ?? input.message ?? "");

      try {
        const response = await fetchImpl(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to,
              type: "text",
              text: { preview_url: false, body },
            }),
          },
        );

        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          return { status: "failed", output: payload, errorMessage: `WhatsApp API returned ${response.status}`, latencyMs };
        }

        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, whatsapp: payload },
          errorMessage: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "WhatsApp request failed", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
