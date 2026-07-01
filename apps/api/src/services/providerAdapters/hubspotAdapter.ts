import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * HubSpot adapter for the `create_contact` capability.
 * Credential value: HubSpot private app access token.
 * Input fields: email (required), firstName?, lastName?, phone?, company?
 * Uses the HubSpot CRM v3 API.
 */
export function createHubSpotAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "hubspot",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = `Bearer ${credential.value}`;

      const email = input.email != null ? String(input.email) : "";
      if (!email) {
        return { status: "failed", output: null, errorMessage: "email is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const properties: Record<string, string> = { email };
      if (input.firstName != null) properties.firstname = String(input.firstName);
      if (input.lastName != null) properties.lastname = String(input.lastName);
      if (input.phone != null) properties.phone = String(input.phone);
      if (input.company != null) properties.company = String(input.company);

      try {
        const response = await fetchImpl(
          "https://api.hubapi.com/crm/v3/objects/contacts",
          {
            method: "POST",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ properties }),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : response.status === 409 ? "DUPLICATE"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `HubSpot API returned ${response.status}`, errorCode, latencyMs };
        }
        const id = String((payload as Record<string, unknown>)?.id ?? "");
        const props = (payload as Record<string, Record<string, unknown>>)?.properties ?? {};
        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, contactId: id, email: props.email },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "HubSpot request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
