import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Jobber adapter for the `create_job` capability.
 * Jobber uses GraphQL API.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Input fields:
 *   clientId (string) — Jobber client ID
 *   title (string)
 *   startAt? (ISO datetime)
 *   endAt? (ISO datetime)
 *   instructions? (string)
 */
export function createJobberAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "jobber",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;

      const clientId = String(input.clientId ?? "");
      if (!clientId) {
        return { status: "failed", output: null, errorMessage: "clientId is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const title = String(input.title ?? "New Job");
      const startAt = input.startAt != null ? String(input.startAt) : null;
      const endAt = input.endAt != null ? String(input.endAt) : null;
      const instructions = input.instructions != null ? String(input.instructions) : null;

      // Jobber GraphQL mutation to create a job
      const mutation = `
        mutation CreateJob($input: JobCreateInput!) {
          jobCreate(input: $input) {
            job {
              id
              title
              jobStatus
            }
            userErrors {
              message
              path
            }
          }
        }
      `;

      const variables: Record<string, unknown> = {
        input: {
          clientId,
          title,
          ...(startAt ? { startAt } : {}),
          ...(endAt ? { endAt } : {}),
          ...(instructions ? { instructions } : {}),
        },
      };

      try {
        const response = await fetchImpl("https://api.getjobber.com/api/graphql", {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
            "X-JOBBER-GRAPHQL-VERSION": "2024-11-01",
          },
          body: JSON.stringify({ query: mutation, variables }),
        });
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 || response.status === 403 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Jobber API returned ${response.status}`, errorCode, latencyMs };
        }

        const data = payload?.data as Record<string, unknown> | undefined;
        const jobCreate = data?.jobCreate as Record<string, unknown> | undefined;
        const userErrors = jobCreate?.userErrors as Array<{ message: string }> | undefined;
        if (userErrors && userErrors.length > 0) {
          return { status: "failed", output: payload, errorMessage: userErrors[0]?.message ?? "Validation error", errorCode: "VALIDATION_ERROR", latencyMs };
        }

        const job = jobCreate?.job as Record<string, unknown> | undefined;
        return {
          status: "succeeded",
          output: {
            toolKey: resolved.toolKey,
            providerKey: resolved.providerKey,
            jobId: job?.id,
            title: job?.title,
            status: job?.jobStatus,
          },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Jobber request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
