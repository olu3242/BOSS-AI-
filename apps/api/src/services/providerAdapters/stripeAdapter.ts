import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Stripe adapter for the `create_payment_intent` capability.
 * Credential value: Stripe secret key (sk_live_... or sk_test_...).
 * Input fields: amount (integer, cents, required), currency? (default "usd"),
 *               customerId?, description?, metadata? (Record<string,string>)
 * Uses the Stripe v1 API with Basic auth and form-encoded body.
 */
export function createStripeAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "stripe",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const authHeader = `Basic ${btoa(credential.value + ":")}`;

      if (input.amount == null) {
        return { status: "failed", output: null, errorMessage: "amount is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const amount = String(input.amount);
      const currency = input.currency != null ? String(input.currency) : "usd";
      const customerId = input.customerId != null ? String(input.customerId) : null;
      const description = input.description != null ? String(input.description) : null;

      const params: Record<string, string> = { amount, currency };
      if (customerId) params.customer = customerId;
      if (description) params.description = description;

      const body = new URLSearchParams(params).toString();

      try {
        const response = await fetchImpl(
          "https://api.stripe.com/v1/payment_intents",
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 ? "AUTH_FAILED"
            : response.status === 402 ? "PAYMENT_DECLINED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Stripe API returned ${response.status}`, errorCode, latencyMs };
        }
        return {
          status: "succeeded",
          output: {
            toolKey: resolved.toolKey,
            providerKey: resolved.providerKey,
            paymentIntentId: payload?.id,
            status: payload?.status,
            clientSecret: payload?.client_secret,
          },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Stripe request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
