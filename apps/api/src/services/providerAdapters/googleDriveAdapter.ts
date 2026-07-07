import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

/**
 * Google Drive adapter — supports upload_document, store_file, generate_pdf.
 * Credential: OAuth2 access token.
 * Files are uploaded via the multipart upload endpoint.
 */
export function createGoogleDriveAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "google_drive",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const accessToken = credential.value;
      const capability = resolved.capabilityKey;

      const headers = { Authorization: `Bearer ${accessToken}` };

      try {
        if (capability === "upload_document" || capability === "store_file") {
          const name = String(input.name ?? "document");
          const content = String(input.content ?? "");
          const mimeType = String(input.mimeType ?? "text/plain");
          const folderId = input.folderId ? String(input.folderId) : undefined;

          const metadata: Record<string, unknown> = { name, mimeType };
          if (folderId) metadata["parents"] = [folderId];

          const boundary = "boss_boundary";
          const body = [
            `--${boundary}`,
            "Content-Type: application/json; charset=UTF-8",
            "",
            JSON.stringify(metadata),
            `--${boundary}`,
            `Content-Type: ${mimeType}`,
            "",
            content,
            `--${boundary}--`,
          ].join("\r\n");

          const response = await fetchImpl(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
              method: "POST",
              headers: { ...headers, "Content-Type": `multipart/related; boundary=${boundary}` },
              body,
            },
          );

          const latencyMs = Date.now() - startedAt;
          const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
          if (!response.ok) return { status: "failed", output: payload, errorMessage: `Google Drive returned ${response.status}`, latencyMs };
          return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: "google_drive", file: payload }, errorMessage: null, latencyMs };
        }

        if (capability === "generate_pdf") {
          // Export an existing Google Doc as PDF
          const fileId = String(input.fileId ?? "");
          const response = await fetchImpl(
            `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf`,
            { method: "GET", headers, body: "{}" },
          );
          const latencyMs = Date.now() - startedAt;
          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
            return { status: "failed", output: payload, errorMessage: `Google Drive export returned ${response.status}`, latencyMs };
          }
          return { status: "succeeded", output: { toolKey: resolved.toolKey, providerKey: "google_drive", exportedFileId: fileId }, errorMessage: null, latencyMs };
        }

        return { status: "failed", output: null, errorMessage: `Unsupported capability: ${capability}`, latencyMs: Date.now() - startedAt };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Google Drive request failed", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
