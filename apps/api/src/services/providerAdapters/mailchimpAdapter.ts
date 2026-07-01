import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Mailchimp adapter for the `add_subscriber` capability.
 * Credential value: Mailchimp API key (used as Basic auth password).
 * Input fields: serverPrefix (e.g. "us6"), listId, email, firstName?, lastName?, tags? (string[])
 * Uses the Mailchimp Marketing API v3.
 */
export function createMailchimpAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "mailchimp",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();

      const serverPrefix = String(input.serverPrefix ?? "");
      if (!serverPrefix) {
        return { status: "failed", output: null, errorMessage: "serverPrefix is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const listId = String(input.listId ?? "");
      if (!listId) {
        return { status: "failed", output: null, errorMessage: "listId is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const email = String(input.email ?? "");
      if (!email) {
        return { status: "failed", output: null, errorMessage: "email is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const firstName = input.firstName != null ? String(input.firstName) : undefined;
      const lastName = input.lastName != null ? String(input.lastName) : undefined;
      const tags = Array.isArray(input.tags) ? (input.tags as string[]) : undefined;

      const authHeader = `Basic ${Buffer.from(`anystring:${credential.value}`).toString("base64")}`;

      const requestBody: Record<string, unknown> = {
        email_address: email,
        status: "subscribed",
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
        tags,
      };

      try {
        const response = await fetchImpl(
          `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`,
          {
            method: "POST",
            headers: {
              Authorization: authHeader,
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
          } else if (response.status === 400 && (payload as Record<string, unknown> | null)?.title === "Member Exists") {
            errorCode = "DUPLICATE";
          } else {
            errorCode = "PROVIDER_UNAVAILABLE";
          }
          return { status: "failed", output: payload, errorMessage: `Mailchimp API returned ${response.status}`, errorCode, latencyMs };
        }

        const memberId = (payload as Record<string, unknown> | null)?.id;
        return {
          status: "succeeded",
          output: { subscriberId: memberId, email, status: "subscribed" },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Mailchimp request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
