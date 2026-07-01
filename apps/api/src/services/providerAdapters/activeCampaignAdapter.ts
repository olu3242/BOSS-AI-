import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * ActiveCampaign adapter for the `create_contact` capability.
 * Credential value: ActiveCampaign API key.
 * Input fields: apiUrl (e.g. "https://myaccount.api-us1.com"), email, firstName?, lastName?, phone?
 * Uses the ActiveCampaign API v3.
 */
export function createActiveCampaignAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "activecampaign",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();

      const apiUrl = String(input.apiUrl ?? "");
      if (!apiUrl) {
        return { status: "failed", output: null, errorMessage: "apiUrl is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const email = String(input.email ?? "");
      if (!email) {
        return { status: "failed", output: null, errorMessage: "email is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const firstName = input.firstName != null ? String(input.firstName) : undefined;
      const lastName = input.lastName != null ? String(input.lastName) : undefined;
      const phone = input.phone != null ? String(input.phone) : undefined;

      const requestBody: Record<string, unknown> = {
        contact: {
          email,
          firstName,
          lastName,
          phone,
        },
      };

      try {
        const response = await fetchImpl(
          `${apiUrl}/api/3/contacts`,
          {
            method: "POST",
            headers: {
              "Api-Token": credential.value,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          let errorCode: string;
          if (response.status === 401) {
            errorCode = "AUTH_FAILED";
          } else if (response.status === 429) {
            errorCode = "RATE_LIMITED";
          } else {
            errorCode = "PROVIDER_UNAVAILABLE";
          }
          return { status: "failed", output: payload, errorMessage: `ActiveCampaign API returned ${response.status}`, errorCode, latencyMs };
        }

        const contact = (payload as Record<string, Record<string, unknown>> | null)?.contact;
        return {
          status: "succeeded",
          output: { contactId: contact?.id, email: contact?.email },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "ActiveCampaign request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
