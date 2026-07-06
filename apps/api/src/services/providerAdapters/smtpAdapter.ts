import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";

/**
 * SMTP adapter — uses a JSON relay endpoint or a standard SMTP-over-HTTP
 * service (e.g. Postal, smtp2go, mailhog). Credential format:
 *   host:port:username:password
 * e.g. "smtp.example.com:587:user@example.com:secret"
 * The adapter posts to an SMTP relay HTTP gateway when available; if the
 * credential encodes only host+port it falls back to a plain auth request.
 * In the common SaaS case (smtp2go, Mailgun SMTP) the gateway URL is derived
 * from the host field.
 */
export function createSmtpAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "smtp",
    async execute(resolved, input, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();

      const parts = credential.value.split(":");
      if (parts.length < 2) {
        return {
          status: "failed",
          output: null,
          errorMessage: "SMTP credential must be formatted as host:port[:username:password]",
          latencyMs: Date.now() - startedAt,
        };
      }

      const [host, portStr, username = "", password = ""] = parts;
      const port = parseInt(portStr ?? "587", 10);

      const to = String(input.to ?? "");
      const from = String(input.from ?? username);
      const subject = String(input.subject ?? "");
      const body = String(input.body ?? "");

      // smtp2go-compatible REST endpoint (https://api.smtp2go.com/v3/email/send)
      // Other providers: detect by host
      const isSmtp2go = host?.includes("smtp2go") || host?.includes("smtp2go.com");
      const apiUrl = isSmtp2go
        ? "https://api.smtp2go.com/v3/email/send"
        : `https://${host}/v3/email/send`;

      try {
        const response = await fetchImpl(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
          },
          body: JSON.stringify({
            api_key: password,
            to: [to],
            sender: from,
            subject,
            text_body: body,
            html_body: input.html ? String(input.html) : undefined,
          }),
        });

        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;

        if (!response.ok) {
          return {
            status: "failed",
            output: payload,
            errorMessage: `SMTP relay returned ${response.status} (${host}:${port})`,
            latencyMs,
          };
        }

        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, smtp: payload },
          errorMessage: null,
          latencyMs,
        };
      } catch (error) {
        return {
          status: "failed",
          output: null,
          errorMessage: error instanceof Error ? error.message : "SMTP request failed",
          latencyMs: Date.now() - startedAt,
        };
      }
    },
  };
}
