import type { ProviderAdapter } from "./types.js";
import { createTwilioSmsAdapter } from "./twilioSmsAdapter.js";
import { createGmailAdapter } from "./gmailAdapter.js";
import { createSlackAdapter } from "./slackAdapter.js";
import { createMicrosoft365Adapter } from "./microsoft365Adapter.js";
import { createTeamsAdapter } from "./teamsAdapter.js";
import { createMessageBirdAdapter } from "./messagebirdAdapter.js";

/**
 * AdapterRegistry — maps providerKey -> ProviderAdapter.
 *
 * Only providers already defined in @boss/registries (general-smb pack) are
 * registered here. Any providerKey not in the map falls back to the simulated
 * execution path in dispatcher.ts.
 *
 * Registered providers (Goal 16C):
 *   twilio       api_key  send_sms
 *   messagebird  api_key  send_sms
 *   gmail        oauth2   send_email
 *   microsoft365 oauth2   send_email
 *   slack        oauth2   send_message, send_notification
 *   teams        oauth2   send_message, send_notification
 *
 * Remaining registered providers (still simulated — no adapter yet):
 *   smtp, google_calendar, outlook_calendar, hubspot, salesforce, zoho,
 *   quickbooks, xero, freshbooks, google_drive, dropbox, onedrive, whatsapp
 */
export function createAdapterRegistry(): Map<string, ProviderAdapter> {
  const registry = new Map<string, ProviderAdapter>();
  const adapters: ProviderAdapter[] = [
    createTwilioSmsAdapter(),
    createMessageBirdAdapter(),
    createGmailAdapter(),
    createMicrosoft365Adapter(),
    createSlackAdapter(),
    createTeamsAdapter(),
  ];
  for (const adapter of adapters) {
    registry.set(adapter.providerKey, adapter);
  }
  return registry;
}
