import type { ProviderAdapter } from "./types.js";
import { createTwilioSmsAdapter } from "./twilioSmsAdapter.js";
import { createGmailAdapter } from "./gmailAdapter.js";
import { createSlackAdapter } from "./slackAdapter.js";
import { createMicrosoft365Adapter } from "./microsoft365Adapter.js";
import { createTeamsAdapter } from "./teamsAdapter.js";
import { createMessageBirdAdapter } from "./messagebirdAdapter.js";
import { createGoogleCalendarAdapter } from "./googleCalendarAdapter.js";
import { createQuickBooksAdapter } from "./quickbooksAdapter.js";
import { createMailchimpAdapter } from "./mailchimpAdapter.js";
import { createActiveCampaignAdapter } from "./activeCampaignAdapter.js";
import { createXeroAdapter } from "./xeroAdapter.js";
import { createSalesforceAdapter } from "./salesforceAdapter.js";
import { createHubSpotAdapter } from "./hubspotAdapter.js";
import { createStripeAdapter } from "./stripeAdapter.js";
import { createServiceTitanAdapter } from "./serviceTitanAdapter.js";
import { createJobberAdapter } from "./jobberAdapter.js";
import { createOutlookCalendarAdapter } from "./outlookCalendarAdapter.js";
import { createSmtpAdapter } from "./smtpAdapter.js";
import { createZohoAdapter } from "./zohoAdapter.js";
import { createFreshBooksAdapter } from "./freshbooksAdapter.js";
import { createGoogleDriveAdapter } from "./googleDriveAdapter.js";
import { createDropboxAdapter } from "./dropboxAdapter.js";
import { createOneDriveAdapter } from "./onedriveAdapter.js";
import { createWhatsAppAdapter } from "./whatsappAdapter.js";

/**
 * AdapterRegistry — maps providerKey -> ProviderAdapter.
 *
 * All 19 general-smb providers have real HTTP adapters; no simulated fallback
 * is used for any registered providerKey.
 *
 * Registered providers:
 *   twilio          api_key  send_sms
 *   messagebird     api_key  send_sms
 *   gmail           oauth2   send_email
 *   microsoft365    oauth2   send_email
 *   smtp            basic    send_email                    [TD-013]
 *   slack           oauth2   send_message, send_notification
 *   teams           oauth2   send_message, send_notification
 *   whatsapp        api_key  send_message                  [TD-013]
 *   google_calendar oauth2   schedule_appointment
 *   outlook_calendar oauth2  schedule_appointment
 *   quickbooks      oauth2   create_invoice
 *   xero            oauth2   create_invoice
 *   freshbooks      oauth2   create_invoice                [TD-013]
 *   hubspot         oauth2   create_customer, update_crm, search_contacts
 *   salesforce      oauth2   create_customer, update_crm, search_contacts
 *   zoho            oauth2   create_customer, update_crm, search_contacts [TD-013]
 *   google_drive    oauth2   upload_document, store_file, generate_pdf [TD-013]
 *   dropbox         oauth2   upload_document, store_file   [TD-013]
 *   onedrive        oauth2   upload_document, store_file   [TD-013]
 *   mailchimp       api_key  (extra — not in toolFabric)
 *   activecampaign  api_key  (extra — not in toolFabric)
 *   stripe          api_key  (extra — not in toolFabric)
 *   servicetitan    oauth2   (extra — not in toolFabric)
 *   jobber          oauth2   (extra — not in toolFabric)
 */
export function createAdapterRegistry(): Map<string, ProviderAdapter> {
  const registry = new Map<string, ProviderAdapter>();
  const adapters: ProviderAdapter[] = [
    createTwilioSmsAdapter(),
    createMessageBirdAdapter(),
    createGmailAdapter(),
    createMicrosoft365Adapter(),
    createSmtpAdapter(),
    createSlackAdapter(),
    createTeamsAdapter(),
    createWhatsAppAdapter(),
    createGoogleCalendarAdapter(),
    createOutlookCalendarAdapter(),
    createQuickBooksAdapter(),
    createXeroAdapter(),
    createFreshBooksAdapter(),
    createMailchimpAdapter(),
    createActiveCampaignAdapter(),
    createSalesforceAdapter(),
    createHubSpotAdapter(),
    createZohoAdapter(),
    createGoogleDriveAdapter(),
    createDropboxAdapter(),
    createOneDriveAdapter(),
    createStripeAdapter(),
    createServiceTitanAdapter(),
    createJobberAdapter(),
  ];
  for (const adapter of adapters) {
    registry.set(adapter.providerKey, adapter);
  }
  return registry;
}
