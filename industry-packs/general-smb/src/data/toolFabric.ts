import {
  capabilityContractRegistry,
  providerDefinitionRegistry,
  toolDefinitionRegistry,
} from "@boss/registries";
import type { CapabilityContractEntry } from "@boss/registries";

const capabilities: CapabilityContractEntry[] = [
  { key: "send_email", capabilityKey: "send_email", label: "Send Email", description: "Send an email to a customer or staff member.", inputSchema: { to: "string", subject: "string", body: "string" }, outputSchema: { messageId: "string" } },
  { key: "send_sms", capabilityKey: "send_sms", label: "Send SMS", description: "Send a text message to a customer.", inputSchema: { to: "string", body: "string" }, outputSchema: { messageId: "string" } },
  { key: "send_message", capabilityKey: "send_message", label: "Send Message", description: "Channel-agnostic capability contract that resolves to email or SMS.", inputSchema: { to: "string", body: "string", channel: "string" }, outputSchema: { messageId: "string" } },
  { key: "schedule_appointment", capabilityKey: "schedule_appointment", label: "Schedule Appointment", description: "Create a calendar appointment.", inputSchema: { startsAt: "string", endsAt: "string", title: "string" }, outputSchema: { eventId: "string" } },
  { key: "create_invoice", capabilityKey: "create_invoice", label: "Create Invoice", description: "Create an invoice in the connected accounting system.", inputSchema: { customerId: "string", amount: "number" }, outputSchema: { invoiceId: "string" } },
  { key: "create_customer", capabilityKey: "create_customer", label: "Create Customer", description: "Create a customer record in the connected CRM.", inputSchema: { name: "string", email: "string" }, outputSchema: { customerId: "string" } },
  { key: "update_crm", capabilityKey: "update_crm", label: "Update CRM", description: "Update a record in the connected CRM.", inputSchema: { recordId: "string", fields: "object" }, outputSchema: { recordId: "string" } },
  { key: "upload_document", capabilityKey: "upload_document", label: "Upload Document", description: "Store a document in the connected storage provider.", inputSchema: { fileName: "string", content: "string" }, outputSchema: { fileId: "string" } },
  { key: "generate_pdf", capabilityKey: "generate_pdf", label: "Generate PDF", description: "Generate a PDF document.", inputSchema: { templateKey: "string", data: "object" }, outputSchema: { fileId: "string" } },
  { key: "send_notification", capabilityKey: "send_notification", label: "Send Notification", description: "Send an in-app or webhook notification.", inputSchema: { businessId: "string", message: "string" }, outputSchema: { notificationId: "string" } },
  { key: "store_file", capabilityKey: "store_file", label: "Store File", description: "Store a file reference in the connected storage provider.", inputSchema: { fileName: "string" }, outputSchema: { fileId: "string" } },
  { key: "search_contacts", capabilityKey: "search_contacts", label: "Search Contacts", description: "Search contacts in the connected CRM.", inputSchema: { query: "string" }, outputSchema: { results: "array" } },
];

const providers = [
  { key: "gmail", providerKey: "gmail", label: "Gmail", category: "email" as const, supportedCapabilities: ["send_email"], authType: "oauth2" as const },
  { key: "microsoft365", providerKey: "microsoft365", label: "Microsoft 365", category: "email" as const, supportedCapabilities: ["send_email", "schedule_appointment"], authType: "oauth2" as const },
  { key: "smtp", providerKey: "smtp", label: "SMTP", category: "email" as const, supportedCapabilities: ["send_email"], authType: "basic" as const },
  { key: "twilio", providerKey: "twilio", label: "Twilio", category: "sms" as const, supportedCapabilities: ["send_sms"], authType: "api_key" as const },
  { key: "messagebird", providerKey: "messagebird", label: "MessageBird", category: "sms" as const, supportedCapabilities: ["send_sms"], authType: "api_key" as const },
  { key: "google_calendar", providerKey: "google_calendar", label: "Google Calendar", category: "calendar" as const, supportedCapabilities: ["schedule_appointment"], authType: "oauth2" as const },
  { key: "outlook_calendar", providerKey: "outlook_calendar", label: "Microsoft Outlook", category: "calendar" as const, supportedCapabilities: ["schedule_appointment"], authType: "oauth2" as const },
  { key: "hubspot", providerKey: "hubspot", label: "HubSpot", category: "crm" as const, supportedCapabilities: ["create_customer", "update_crm", "search_contacts"], authType: "oauth2" as const },
  { key: "salesforce", providerKey: "salesforce", label: "Salesforce", category: "crm" as const, supportedCapabilities: ["create_customer", "update_crm", "search_contacts"], authType: "oauth2" as const },
  { key: "zoho", providerKey: "zoho", label: "Zoho", category: "crm" as const, supportedCapabilities: ["create_customer", "update_crm", "search_contacts"], authType: "oauth2" as const },
  { key: "quickbooks", providerKey: "quickbooks", label: "QuickBooks", category: "accounting" as const, supportedCapabilities: ["create_invoice"], authType: "oauth2" as const },
  { key: "xero", providerKey: "xero", label: "Xero", category: "accounting" as const, supportedCapabilities: ["create_invoice"], authType: "oauth2" as const },
  { key: "freshbooks", providerKey: "freshbooks", label: "FreshBooks", category: "accounting" as const, supportedCapabilities: ["create_invoice"], authType: "oauth2" as const },
  { key: "google_drive", providerKey: "google_drive", label: "Google Drive", category: "storage" as const, supportedCapabilities: ["upload_document", "store_file", "generate_pdf"], authType: "oauth2" as const },
  { key: "dropbox", providerKey: "dropbox", label: "Dropbox", category: "storage" as const, supportedCapabilities: ["upload_document", "store_file"], authType: "oauth2" as const },
  { key: "onedrive", providerKey: "onedrive", label: "OneDrive", category: "storage" as const, supportedCapabilities: ["upload_document", "store_file"], authType: "oauth2" as const },
  { key: "slack", providerKey: "slack", label: "Slack", category: "messaging" as const, supportedCapabilities: ["send_notification", "send_message"], authType: "oauth2" as const },
  { key: "teams", providerKey: "teams", label: "Microsoft Teams", category: "messaging" as const, supportedCapabilities: ["send_notification", "send_message"], authType: "oauth2" as const },
  { key: "whatsapp", providerKey: "whatsapp", label: "WhatsApp", category: "messaging" as const, supportedCapabilities: ["send_message"], authType: "api_key" as const },
];

const tools = [
  { key: "tool_send_email", toolKey: "tool_send_email", label: "Send Email", capabilityKey: "send_email", supportedProviderKeys: ["gmail", "microsoft365", "smtp"], requiredPermissions: ["integration.email.send"], retryLimit: 3, timeoutMs: 10000, rateLimitPerMinute: 60, auditLevel: "standard" as const },
  { key: "tool_send_sms", toolKey: "tool_send_sms", label: "Send SMS", capabilityKey: "send_sms", supportedProviderKeys: ["twilio", "messagebird"], requiredPermissions: ["integration.sms.send"], retryLimit: 3, timeoutMs: 10000, rateLimitPerMinute: 60, auditLevel: "standard" as const },
  { key: "tool_send_message", toolKey: "tool_send_message", label: "Send Message", capabilityKey: "send_message", supportedProviderKeys: ["gmail", "microsoft365", "smtp", "twilio", "messagebird", "slack", "teams", "whatsapp"], requiredPermissions: ["integration.message.send"], retryLimit: 3, timeoutMs: 10000, rateLimitPerMinute: 60, auditLevel: "standard" as const },
  { key: "tool_schedule_appointment", toolKey: "tool_schedule_appointment", label: "Schedule Appointment", capabilityKey: "schedule_appointment", supportedProviderKeys: ["google_calendar", "outlook_calendar", "microsoft365"], requiredPermissions: ["integration.calendar.write"], retryLimit: 2, timeoutMs: 10000, rateLimitPerMinute: 30, auditLevel: "standard" as const },
  { key: "tool_create_invoice", toolKey: "tool_create_invoice", label: "Create Invoice", capabilityKey: "create_invoice", supportedProviderKeys: ["quickbooks", "xero", "freshbooks"], requiredPermissions: ["integration.accounting.write"], retryLimit: 2, timeoutMs: 15000, rateLimitPerMinute: 20, auditLevel: "sensitive" as const },
  { key: "tool_create_customer", toolKey: "tool_create_customer", label: "Create Customer", capabilityKey: "create_customer", supportedProviderKeys: ["hubspot", "salesforce", "zoho"], requiredPermissions: ["integration.crm.write"], retryLimit: 2, timeoutMs: 10000, rateLimitPerMinute: 30, auditLevel: "standard" as const },
  { key: "tool_update_crm", toolKey: "tool_update_crm", label: "Update CRM", capabilityKey: "update_crm", supportedProviderKeys: ["hubspot", "salesforce", "zoho"], requiredPermissions: ["integration.crm.write"], retryLimit: 2, timeoutMs: 10000, rateLimitPerMinute: 30, auditLevel: "standard" as const },
  { key: "tool_upload_document", toolKey: "tool_upload_document", label: "Upload Document", capabilityKey: "upload_document", supportedProviderKeys: ["google_drive", "dropbox", "onedrive"], requiredPermissions: ["integration.storage.write"], retryLimit: 3, timeoutMs: 20000, rateLimitPerMinute: 30, auditLevel: "standard" as const },
  { key: "tool_generate_pdf", toolKey: "tool_generate_pdf", label: "Generate PDF", capabilityKey: "generate_pdf", supportedProviderKeys: ["google_drive"], requiredPermissions: ["integration.storage.write"], retryLimit: 2, timeoutMs: 15000, rateLimitPerMinute: 20, auditLevel: "standard" as const },
  { key: "tool_send_notification", toolKey: "tool_send_notification", label: "Send Notification", capabilityKey: "send_notification", supportedProviderKeys: ["slack", "teams"], requiredPermissions: ["integration.message.send"], retryLimit: 3, timeoutMs: 10000, rateLimitPerMinute: 60, auditLevel: "none" as const },
  { key: "tool_store_file", toolKey: "tool_store_file", label: "Store File", capabilityKey: "store_file", supportedProviderKeys: ["google_drive", "dropbox", "onedrive"], requiredPermissions: ["integration.storage.write"], retryLimit: 3, timeoutMs: 20000, rateLimitPerMinute: 30, auditLevel: "standard" as const },
  { key: "tool_search_contacts", toolKey: "tool_search_contacts", label: "Search Contacts", capabilityKey: "search_contacts", supportedProviderKeys: ["hubspot", "salesforce", "zoho"], requiredPermissions: ["integration.crm.read"], retryLimit: 2, timeoutMs: 10000, rateLimitPerMinute: 30, auditLevel: "none" as const },
];

export function seedToolFabric(): void {
  for (const capability of capabilities) {
    capabilityContractRegistry.register(capability);
  }
  for (const provider of providers) {
    providerDefinitionRegistry.register(provider);
  }
  for (const tool of tools) {
    toolDefinitionRegistry.register(tool);
  }
}
