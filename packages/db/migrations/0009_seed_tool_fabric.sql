-- Goal 8: seed Capability Contracts, Provider Definitions, and Tool Definitions.
-- Generated from industry-packs/general-smb/src/data/toolFabric.ts to avoid transcription drift.

INSERT INTO capability_contracts (capability_key, label, description, input_schema, output_schema) VALUES
  ('send_email', 'Send Email', 'Send an email to a customer or staff member.', '{"to":"string","subject":"string","body":"string"}'::jsonb, '{"messageId":"string"}'::jsonb),
  ('send_sms', 'Send SMS', 'Send a text message to a customer.', '{"to":"string","body":"string"}'::jsonb, '{"messageId":"string"}'::jsonb),
  ('send_message', 'Send Message', 'Channel-agnostic capability contract that resolves to email or SMS.', '{"to":"string","body":"string","channel":"string"}'::jsonb, '{"messageId":"string"}'::jsonb),
  ('schedule_appointment', 'Schedule Appointment', 'Create a calendar appointment.', '{"startsAt":"string","endsAt":"string","title":"string"}'::jsonb, '{"eventId":"string"}'::jsonb),
  ('create_invoice', 'Create Invoice', 'Create an invoice in the connected accounting system.', '{"customerId":"string","amount":"number"}'::jsonb, '{"invoiceId":"string"}'::jsonb),
  ('create_customer', 'Create Customer', 'Create a customer record in the connected CRM.', '{"name":"string","email":"string"}'::jsonb, '{"customerId":"string"}'::jsonb),
  ('update_crm', 'Update CRM', 'Update a record in the connected CRM.', '{"recordId":"string","fields":"object"}'::jsonb, '{"recordId":"string"}'::jsonb),
  ('upload_document', 'Upload Document', 'Store a document in the connected storage provider.', '{"fileName":"string","content":"string"}'::jsonb, '{"fileId":"string"}'::jsonb),
  ('generate_pdf', 'Generate PDF', 'Generate a PDF document.', '{"templateKey":"string","data":"object"}'::jsonb, '{"fileId":"string"}'::jsonb),
  ('send_notification', 'Send Notification', 'Send an in-app or webhook notification.', '{"businessId":"string","message":"string"}'::jsonb, '{"notificationId":"string"}'::jsonb),
  ('store_file', 'Store File', 'Store a file reference in the connected storage provider.', '{"fileName":"string"}'::jsonb, '{"fileId":"string"}'::jsonb),
  ('search_contacts', 'Search Contacts', 'Search contacts in the connected CRM.', '{"query":"string"}'::jsonb, '{"results":"array"}'::jsonb);

INSERT INTO provider_definitions (provider_key, label, category, supported_capabilities, auth_type) VALUES
  ('gmail', 'Gmail', 'email', '["send_email"]'::jsonb, 'oauth2'),
  ('microsoft365', 'Microsoft 365', 'email', '["send_email","schedule_appointment"]'::jsonb, 'oauth2'),
  ('smtp', 'SMTP', 'email', '["send_email"]'::jsonb, 'basic'),
  ('twilio', 'Twilio', 'sms', '["send_sms"]'::jsonb, 'api_key'),
  ('messagebird', 'MessageBird', 'sms', '["send_sms"]'::jsonb, 'api_key'),
  ('google_calendar', 'Google Calendar', 'calendar', '["schedule_appointment"]'::jsonb, 'oauth2'),
  ('outlook_calendar', 'Microsoft Outlook', 'calendar', '["schedule_appointment"]'::jsonb, 'oauth2'),
  ('hubspot', 'HubSpot', 'crm', '["create_customer","update_crm","search_contacts"]'::jsonb, 'oauth2'),
  ('salesforce', 'Salesforce', 'crm', '["create_customer","update_crm","search_contacts"]'::jsonb, 'oauth2'),
  ('zoho', 'Zoho', 'crm', '["create_customer","update_crm","search_contacts"]'::jsonb, 'oauth2'),
  ('quickbooks', 'QuickBooks', 'accounting', '["create_invoice"]'::jsonb, 'oauth2'),
  ('xero', 'Xero', 'accounting', '["create_invoice"]'::jsonb, 'oauth2'),
  ('freshbooks', 'FreshBooks', 'accounting', '["create_invoice"]'::jsonb, 'oauth2'),
  ('google_drive', 'Google Drive', 'storage', '["upload_document","store_file","generate_pdf"]'::jsonb, 'oauth2'),
  ('dropbox', 'Dropbox', 'storage', '["upload_document","store_file"]'::jsonb, 'oauth2'),
  ('onedrive', 'OneDrive', 'storage', '["upload_document","store_file"]'::jsonb, 'oauth2'),
  ('slack', 'Slack', 'messaging', '["send_notification","send_message"]'::jsonb, 'oauth2'),
  ('teams', 'Microsoft Teams', 'messaging', '["send_notification","send_message"]'::jsonb, 'oauth2'),
  ('whatsapp', 'WhatsApp', 'messaging', '["send_message"]'::jsonb, 'api_key');

INSERT INTO tool_definitions (tool_key, label, capability_key, supported_provider_keys, required_permissions, retry_limit, timeout_ms, rate_limit_per_minute, audit_level) VALUES
  ('tool_send_email', 'Send Email', 'send_email', '["gmail","microsoft365","smtp"]'::jsonb, '["integration.email.send"]'::jsonb, 3, 10000, 60, 'standard'),
  ('tool_send_sms', 'Send SMS', 'send_sms', '["twilio","messagebird"]'::jsonb, '["integration.sms.send"]'::jsonb, 3, 10000, 60, 'standard'),
  ('tool_send_message', 'Send Message', 'send_message', '["gmail","microsoft365","smtp","twilio","messagebird","slack","teams","whatsapp"]'::jsonb, '["integration.message.send"]'::jsonb, 3, 10000, 60, 'standard'),
  ('tool_schedule_appointment', 'Schedule Appointment', 'schedule_appointment', '["google_calendar","outlook_calendar","microsoft365"]'::jsonb, '["integration.calendar.write"]'::jsonb, 2, 10000, 30, 'standard'),
  ('tool_create_invoice', 'Create Invoice', 'create_invoice', '["quickbooks","xero","freshbooks"]'::jsonb, '["integration.accounting.write"]'::jsonb, 2, 15000, 20, 'sensitive'),
  ('tool_create_customer', 'Create Customer', 'create_customer', '["hubspot","salesforce","zoho"]'::jsonb, '["integration.crm.write"]'::jsonb, 2, 10000, 30, 'standard'),
  ('tool_update_crm', 'Update CRM', 'update_crm', '["hubspot","salesforce","zoho"]'::jsonb, '["integration.crm.write"]'::jsonb, 2, 10000, 30, 'standard'),
  ('tool_upload_document', 'Upload Document', 'upload_document', '["google_drive","dropbox","onedrive"]'::jsonb, '["integration.storage.write"]'::jsonb, 3, 20000, 30, 'standard'),
  ('tool_generate_pdf', 'Generate PDF', 'generate_pdf', '["google_drive"]'::jsonb, '["integration.storage.write"]'::jsonb, 2, 15000, 20, 'standard'),
  ('tool_send_notification', 'Send Notification', 'send_notification', '["slack","teams"]'::jsonb, '["integration.message.send"]'::jsonb, 3, 10000, 60, 'none'),
  ('tool_store_file', 'Store File', 'store_file', '["google_drive","dropbox","onedrive"]'::jsonb, '["integration.storage.write"]'::jsonb, 3, 20000, 30, 'standard'),
  ('tool_search_contacts', 'Search Contacts', 'search_contacts', '["hubspot","salesforce","zoho"]'::jsonb, '["integration.crm.read"]'::jsonb, 2, 10000, 30, 'none');
