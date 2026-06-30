import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * QuickBooks Online adapter for the `create_invoice` capability.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Input fields: realmId (company ID), customerId, lineItems (array of {description, amount, quantity?}),
 *               currency? (default "USD"), dueDate? (ISO date string)
 * Uses the QuickBooks Online v3 API.
 */
export function createQuickBooksAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "quickbooks",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;
      const realmId = String(input.realmId ?? "");
      if (!realmId) {
        return { status: "failed", output: null, errorMessage: "realmId (QuickBooks company ID) is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const customerId = String(input.customerId ?? "");
      const lineItems = Array.isArray(input.lineItems) ? input.lineItems as Array<{ description: string; amount: number; quantity?: number }> : [];
      const currency = String(input.currency ?? "USD");
      const dueDate = input.dueDate != null ? String(input.dueDate) : null;

      const qbLineItems = lineItems.map((item, idx) => ({
        Id: String(idx + 1),
        Amount: item.amount,
        DetailType: "SalesItemLineDetail",
        Description: item.description,
        SalesItemLineDetail: {
          Qty: item.quantity ?? 1,
          UnitPrice: item.amount / (item.quantity ?? 1),
        },
      }));

      const invoiceBody: Record<string, unknown> = {
        CustomerRef: { value: customerId },
        CurrencyRef: { value: currency },
        Line: qbLineItems,
      };
      if (dueDate) invoiceBody.DueDate = dueDate;

      const baseUrl = process.env.QB_SANDBOX === "true"
        ? "https://sandbox-quickbooks.api.intuit.com"
        : "https://quickbooks.api.intuit.com";

      try {
        const response = await fetchImpl(
          `${baseUrl}/v3/company/${realmId}/invoice`,
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ Invoice: invoiceBody }),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 || response.status === 403 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `QuickBooks API returned ${response.status}`, errorCode, latencyMs };
        }
        const invoice = (payload as Record<string, Record<string, unknown>>)?.Invoice;
        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, invoiceId: invoice?.Id, invoiceNumber: invoice?.DocNumber, totalAmt: invoice?.TotalAmt },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "QuickBooks request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
