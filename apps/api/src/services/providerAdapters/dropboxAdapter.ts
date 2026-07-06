import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

/**
 * Dropbox adapter — supports upload_document and store_file.
 * Credential: OAuth2 access token.
 */
export function createDropboxAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "dropbox",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const accessToken = credential.value;
      const capability = resolved.capabilityKey;

      if (capability !== "upload_document" && capability !== "store_file") {
        return { status: "failed", output: null, errorMessage: `Unsupported capability: ${capability}`, latencyMs: Date.now() - startedAt };
      }

      const path = String(input.path ?? `/${String(input.name ?? "file")}`);
      const content = String(input.content ?? "");

      try {
        const response = await fetchImpl("https://content.dropboxapi.com/2/files/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/octet-stream",
            "Dropbox-API-Arg": JSON.stringify({ path, mode: "add", autorename: true, mute: false }),
          },
          body: content,
        });

        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          return { status: "failed", output: payload, errorMessage: `Dropbox returned ${response.status}`, latencyMs };
        }

        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, dropbox: payload },
          errorMessage: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Dropbox request failed", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
