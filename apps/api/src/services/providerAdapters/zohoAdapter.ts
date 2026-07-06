import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

const BASE = "https://www.zohoapis.com/crm/v3";

export function createZohoAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "zoho",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const accessToken = credential.value;
      const capability = resolved.capabilityKey;

      const headers = {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      };

      try {
        if (capability === "create_customer") {
          const response = await fetchImpl(`${BASE}/Contacts`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              data: [{
                Last_Name: String(input.name ?? ""),
                Email: String(input.email ?? ""),
                Phone: input.phone ? String(input.phone) : undefined,
                Account_Name: input.company ? String(input.company) : undefined,
              }],
            }),
          });
          const latencyMs = Date.now() - startedAt;
          const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
          if (!response.ok) return { status: "failed", output: payload, errorMessage: `Zoho returned ${response.status}`, latencyMs };
          return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: "zoho", zoho: payload }, errorMessage: null, latencyMs };
        }

        if (capability === "update_crm") {
          const id = String(input.id ?? "");
          const response = await fetchImpl(`${BASE}/Contacts/${id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify({ data: [{ ...input, id }] }),
          });
          const latencyMs = Date.now() - startedAt;
          const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
          if (!response.ok) return { status: "failed", output: payload, errorMessage: `Zoho returned ${response.status}`, latencyMs };
          return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: "zoho", zoho: payload }, errorMessage: null, latencyMs };
        }

        if (capability === "search_contacts") {
          const query = encodeURIComponent(String(input.query ?? ""));
          const response = await fetchImpl(`${BASE}/Contacts/search?word=${query}`, {
            method: "GET",
            headers,
            body: "{}",
          });
          const latencyMs = Date.now() - startedAt;
          const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
          if (!response.ok) return { status: "failed", output: payload, errorMessage: `Zoho returned ${response.status}`, latencyMs };
          return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: "zoho", zoho: payload }, errorMessage: null, latencyMs };
        }

        return { status: "failed", output: null, errorMessage: `Unsupported capability: ${capability}`, latencyMs: Date.now() - startedAt };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Zoho request failed", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
