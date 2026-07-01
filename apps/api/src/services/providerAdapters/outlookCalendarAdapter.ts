import type { ProviderAdapter, ProviderAdapterResult, ResolvedCredential, FetchLike } from "./types.js";
import type { ResolvedTool } from "@boss/mcp";

/**
 * Outlook Calendar adapter for the `schedule_appointment` capability.
 * Uses Microsoft Graph API v1.0.
 * Credential value: `Bearer <oauth2_access_token>` (Microsoft Graph token).
 * Input fields:
 *   subject (string)
 *   startDateTime (ISO datetime string, e.g. "2024-01-15T10:00:00")
 *   endDateTime (ISO datetime string)
 *   timeZone? (IANA timezone, default "UTC")
 *   attendeeEmails? (string[])
 *   body? (string — event description)
 *   isOnlineMeeting? (boolean — creates Teams meeting link)
 *   calendarId? (string — specific calendar ID, defaults to primary calendar)
 */
export function createOutlookCalendarAdapter(fetchImpl: FetchLike = fetch): ProviderAdapter {
  return {
    providerKey: "outlook_calendar",
    async execute(resolved: ResolvedTool, input: Record<string, unknown>, credential: ResolvedCredential): Promise<ProviderAdapterResult> {
      const startedAt = Date.now();
      const token = credential.value.startsWith("Bearer ") ? credential.value : `Bearer ${credential.value}`;

      const subject = String(input.subject ?? "");
      if (!subject) {
        return { status: "failed", output: null, errorMessage: "subject is required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const startDateTime = String(input.startDateTime ?? "");
      const endDateTime = String(input.endDateTime ?? "");
      if (!startDateTime || !endDateTime) {
        return { status: "failed", output: null, errorMessage: "startDateTime and endDateTime are required", errorCode: "INVALID_INPUT", latencyMs: 0 };
      }

      const timeZone = String(input.timeZone ?? "UTC");
      const attendeeEmails = Array.isArray(input.attendeeEmails) ? (input.attendeeEmails as string[]) : [];
      const bodyContent = input.body != null ? String(input.body) : null;
      const isOnlineMeeting = Boolean(input.isOnlineMeeting ?? false);
      const calendarId = input.calendarId != null ? String(input.calendarId) : null;

      const eventBody: Record<string, unknown> = {
        subject,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
        isOnlineMeeting,
        onlineMeetingProvider: isOnlineMeeting ? "teamsForBusiness" : undefined,
      };

      if (bodyContent) {
        eventBody.body = { contentType: "text", content: bodyContent };
      }

      if (attendeeEmails.length > 0) {
        eventBody.attendees = attendeeEmails.map((email) => ({
          emailAddress: { address: email },
          type: "required",
        }));
      }

      const endpoint = calendarId
        ? `https://graph.microsoft.com/v1.0/me/calendars/${calendarId}/events`
        : "https://graph.microsoft.com/v1.0/me/events";

      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventBody),
        });
        const latencyMs = Date.now() - startedAt;
        const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
        if (!response.ok) {
          const errorCode =
            response.status === 401 || response.status === 403 ? "AUTH_FAILED"
            : response.status === 429 ? "RATE_LIMITED"
            : "PROVIDER_UNAVAILABLE";
          return { status: "failed", output: payload, errorMessage: `Outlook Calendar API returned ${response.status}`, errorCode, latencyMs };
        }
        return {
          status: "succeeded",
          output: {
            toolKey: resolved.toolKey,
            providerKey: resolved.providerKey,
            eventId: payload?.id,
            webLink: payload?.webLink,
            onlineMeetingUrl: (payload?.onlineMeeting as Record<string, unknown> | undefined)?.joinUrl ?? null,
          },
          errorMessage: null,
          errorCode: null,
          latencyMs,
        };
      } catch (error) {
        return { status: "failed", output: null, errorMessage: error instanceof Error ? error.message : "Outlook Calendar request failed", errorCode: "NETWORK_ERROR", latencyMs: Date.now() - startedAt };
      }
    },
  };
}
