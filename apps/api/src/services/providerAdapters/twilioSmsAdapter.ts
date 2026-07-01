import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";



/**
 * Real Twilio REST API client for the `send_sms` capability. Twilio is the
 * only registry provider wired with a non-OAuth, single-secret auth model
 * (authType "api_key"), making it the lowest-risk first production adapter.
 * Credential value is expected to be "<accountSid>:<authToken>".
 */
export function createTwilioSmsAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "twilio",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const [accountSid, authToken] = credential.value.split(":");
      if (!accountSid || !authToken) {
        return {
          status: "failed",
          output: null,
          errorMessage: "Twilio credential must be formatted as <accountSid>:<authToken>",
          latencyMs: Date.now() - startedAt,
        };
      }

      const to = String(input.to ?? "");
      const from = String(input.from ?? "");
      const body = String(input.body ?? "");

      try {
        const response = await fetchImpl(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
          }
        );

        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          return {
            status: "failed",
            output: payload,
            errorMessage: `Twilio API returned ${response.status}`,
            latencyMs,
          };
        }

        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, twilio: payload },
          errorMessage: null,
          latencyMs,
        };
      } catch (error) {
        return {
          status: "failed",
          output: null,
          errorMessage: error instanceof Error ? error.message : "Twilio request failed",
          latencyMs: Date.now() - startedAt,
        };
      }
    },
  };
}
