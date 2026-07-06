import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

/**
 * OneDrive (Microsoft Graph) adapter — supports upload_document and store_file.
 * Credential: OAuth2 access token.
 */
export function createOneDriveAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "onedrive",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const accessToken = credential.value;
      const capability = resolved.capabilityKey;

      if (capability !== "upload_document" && capability !== "store_file") {
        return { status: "failed", output: null, errorMessage: `Unsupported capability: ${capability}`, latencyMs: Date.now() - startedAt };
      }

      const name = String(input.name ?? "document");
      const content = String(input.content ?? "");
      const folderId = input.folderId ? String(input.folderId) : "root";

      const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folderId}:/${encodeURIComponent(name)}:/content`;

      try {
        const response = await fetchImpl(uploadUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "text/plain",
          },
          body: content,
        });

        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          return { status: "failed", output: payload, errorMessage: `OneDrive returned ${response.status}`, latencyMs };
        }

        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, onedrive: payload },
          errorMessage: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "OneDrive request failed", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
