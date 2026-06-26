-- Seeds the registry-driven MRI question catalog with the canonical
-- General SMB question set (mirrors industry-packs/general-smb/src/data/mri.ts).
INSERT INTO business_mri_questions (question_key, section_key, label, question_type, options, required, sort_order) VALUES
  ('identity.business_name', 'identity', 'Business Name', 'text', NULL, true, 1),
  ('identity.business_type', 'identity', 'Business Type', 'text', NULL, true, 2),
  ('identity.years_operating', 'identity', 'Years Operating', 'number', NULL, true, 3),
  ('identity.employees', 'identity', 'Employees', 'number', NULL, true, 4),
  ('identity.locations', 'identity', 'Locations', 'number', NULL, true, 5),
  ('identity.business_hours', 'identity', 'Business Hours', 'text', NULL, false, 6),

  ('customers.customer_types', 'customers', 'Customer Types', 'multi_select', '["b2c","b2b","mixed"]', true, 1),
  ('customers.acquisition_channels', 'customers', 'Acquisition Channels', 'multi_select', '["referral","search","social","ads","walk_in","partnerships"]', true, 2),
  ('customers.repeat_business', 'customers', 'Repeat Business', 'scale', NULL, true, 3),
  ('customers.lifetime_value', 'customers', 'Lifetime Value', 'number', NULL, false, 4),
  ('customers.communication', 'customers', 'Customer Communication', 'multi_select', '["phone","email","sms","in_person","chat"]', true, 5),

  ('sales.lead_sources', 'sales', 'Lead Sources', 'multi_select', '["referral","website","social","ads","cold_outreach"]', true, 1),
  ('sales.follow_up_process', 'sales', 'Follow-up Process', 'single_select', '["none","manual","semi_automated","automated"]', true, 2),
  ('sales.sales_cycle', 'sales', 'Sales Cycle', 'single_select', '["same_day","days","weeks","months"]', true, 3),
  ('sales.conversion_rate', 'sales', 'Conversion Rate', 'number', NULL, false, 4),
  ('sales.quote_process', 'sales', 'Quote Process', 'single_select', '["verbal","manual_document","software"]', true, 5),

  ('operations.scheduling', 'operations', 'Scheduling', 'single_select', '["paper","spreadsheet","software"]', true, 1),
  ('operations.daily_tasks', 'operations', 'Daily Tasks', 'single_select', '["informal","checklist","task_software"]', true, 2),
  ('operations.team_responsibilities', 'operations', 'Team Responsibilities', 'single_select', '["undefined","informal","documented"]', true, 3),
  ('operations.process_documentation', 'operations', 'Process Documentation', 'boolean', NULL, true, 4),
  ('operations.bottlenecks', 'operations', 'Bottlenecks', 'multi_select', '["scheduling","communication","staffing","supply","approvals"]', false, 5),

  ('finance.revenue_sources', 'finance', 'Revenue Sources', 'multi_select', '["products","services","subscriptions","mixed"]', true, 1),
  ('finance.invoicing', 'finance', 'Invoicing', 'single_select', '["manual","spreadsheet","software"]', true, 2),
  ('finance.collections', 'finance', 'Collections', 'single_select', '["informal","manual_reminders","automated"]', true, 3),
  ('finance.expenses', 'finance', 'Expenses', 'single_select', '["unmanaged","manual_tracking","software"]', true, 4),
  ('finance.cash_flow_visibility', 'finance', 'Cash Flow Visibility', 'scale', NULL, true, 5),

  ('marketing.website', 'marketing', 'Website', 'boolean', NULL, true, 1),
  ('marketing.social_media', 'marketing', 'Social Media', 'multi_select', '["facebook","instagram","linkedin","tiktok","none"]', false, 2),
  ('marketing.email_marketing', 'marketing', 'Email Marketing', 'boolean', NULL, true, 3),
  ('marketing.reviews', 'marketing', 'Reviews', 'scale', NULL, true, 4),
  ('marketing.referral_programs', 'marketing', 'Referral Programs', 'boolean', NULL, true, 5),

  ('technology.crm', 'technology', 'CRM', 'boolean', NULL, true, 1),
  ('technology.accounting_software', 'technology', 'Accounting Software', 'boolean', NULL, true, 2),
  ('technology.calendar', 'technology', 'Calendar', 'boolean', NULL, true, 3),
  ('technology.phone', 'technology', 'Phone', 'single_select', '["personal_cell","business_line","voip_system"]', true, 4),
  ('technology.email', 'technology', 'Email', 'single_select', '["personal","business_domain"]', true, 5),
  ('technology.existing_ai_usage', 'technology', 'Existing AI Usage', 'boolean', NULL, true, 6),

  ('goals.priorities', 'goals', 'Top Goals', 'multi_select', '["growth","profitability","customer_experience","operations","automation","staff_productivity"]', true, 1),

  ('pain_points.challenges', 'pain_points', 'Challenges', 'multi_select', '["missed_leads","slow_follow_up","administrative_overload","low_reviews","poor_visibility","scheduling_issues","outstanding_invoices","customer_retention"]', true, 1);
