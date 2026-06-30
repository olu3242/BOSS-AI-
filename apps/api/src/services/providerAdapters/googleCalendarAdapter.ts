import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Google Calendar adapter for the `schedule_appointment` capability.
 * Credential value: `Bearer <oauth2_access_token>`.
 * Input fields: title, startTime (ISO 8601), endTime (ISO 8601),
 *               description?, attendees? (string[]), calendarId? (default "primary")
 */
export function createGoogleCalendarAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "google_calendar",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;
      const calendarId = encodeURIComponent(String(input.calendarId ?? "primary"));
      const title = String(input.title ?? "Appointment");
      const startTime = String(input.startTime ?? new Date().toISOString());
      const endTime = String(input.endTime ?? new Date(Date.now() + 3600_000).toISOString());
      const description = input.description != null ? String(input.description) : undefined;
      const attendees = Array.isArray(input.attendees)
        ? (input.attendees as string[]).map((email) => ({ email }))
        : [];

      const body: Record<string, unknown> = {
        summary: title,
        start: { dateTime: startTime, timeZone: "UTC" },
        end: { dateTime: endTime, timeZone: "UTC" },
        attendees,
      };
      if (description) body.description = description;

      try {
        const response = await fetchImpl(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 || response.status === 403 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Google Calendar API returned ${response.status}`, errorCode, latencyMs };
        }
        return {
          status: "succeeded",
          output: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, eventId: payload?.id, htmlLink: payload?.htmlLink },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Google Calendar request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
