import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Xero adapter for the `create_invoice` capability.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Input fields: tenantId (Xero Tenant-ID), contactId, lineItems (array of {description, quantity, unitAmount, accountCode?}),
 *               currency? (default "USD"), dueDate? (ISO date string)
 * Uses the Xero API v2.0.
 */
export function createXeroAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "xero",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;

      const tenantId = String(input.tenantId ?? "");
      if (!tenantId) {
        return { status: "failed", output: null, errorMessage: "tenantId (Xero Tenant-ID) is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const contactId = String(input.contactId ?? "");
      const lineItems = Array.isArray(input.lineItems) ? input.lineItems as Array<{ description: string; quantity: number; unitAmount: number; accountCode?: string }> : [];
      const currency = String(input.currency ?? "USD");
      const dueDate = input.dueDate != null ? String(input.dueDate) : undefined;

      const xeroLineItems = lineItems.map((item) => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitAmount: item.unitAmount,
        AccountCode: item.accountCode ?? "200",
      }));

      const invoiceBody: Record<string, unknown> = {
        Type: "ACCREC",
        Contact: { ContactID: contactId },
        LineItems: xeroLineItems,
        CurrencyCode: currency,
      };
      if (dueDate) invoiceBody.DueDate = dueDate;

      try {
        const response = await fetchImpl(
          "https://api.xero.com/api.xro/2.0/Invoices",
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
              Accept: "application/json",
              "Xero-tenant-id": tenantId,
            },
            body: JSON.stringify({ Invoices: [invoiceBody] }),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 || response.status === 403 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Xero API returned ${response.status}`, errorCode, latencyMs };
        }
        const invoices = (payload as Record<string, unknown[]>)?.Invoices;
        const invoice = Array.isArray(invoices) ? (invoices[0] as Record<string, unknown>) : null;
        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, invoiceId: invoice?.InvoiceID, invoiceNumber: invoice?.InvoiceNumber, total: invoice?.Total },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Xero request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
