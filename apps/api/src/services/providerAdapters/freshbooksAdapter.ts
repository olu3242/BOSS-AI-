import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

/**
 * FreshBooks adapter for the create_invoice capability.
 * Credential format: accountId:accessToken
 */
export function createFreshBooksAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "freshbooks",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();

      const [accountId, accessToken] = credential.value.split(":");
      if (!accountId || !accessToken) {
        return { status: "failed", output: null, errorMessage: "FreshBooks credential must be formatted as accountId:accessToken", latencyMs: Date.now() - startedAt };
      }

      const lines = Array.isArray(input.lines) ? input.lines : [];
      const invoicePayload = {
        invoice: {
          customerid: String(input.customerId ?? ""),
          create_date: String(input.date ?? new Date().toISOString().slice(0, 10)),
          lines: lines.map((line: Record<string, unknown>) => ({
            type: 0,
            description: String(line.description ?? ""),
            unit_cost: { amount: String(line.unitPrice ?? 0), code: "USD" },
            qty: Number(line.quantity ?? 1),
          })),
        },
      };

      try {
        const response = await fetchImpl(
          `https://api.freshbooks.com/accounting/account/${accountId}/invoices/invoices`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "Api-Version": "alpha",
            },
            body: JSON.stringify(invoicePayload),
          },
        );

        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          return { status: "failed", output: payload, errorMessage: `FreshBooks returned ${response.status}`, latencyMs };
        }

        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, freshbooks: payload },
          errorMessage: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "FreshBooks request failed", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
