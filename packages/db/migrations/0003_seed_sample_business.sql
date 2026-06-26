-- Realistic General SMB sample business, fully walked through the MRI,
-- with derived DNA, Health, Capabilities, and Timeline — demonstrates the
-- complete Business Intelligence Layer end to end.
DO $$
DECLARE
  v_org_id uuid := '11111111-1111-1111-1111-111111111111';
  v_business_id uuid;
  v_mri_id uuid;
  v_health_id uuid;
BEGIN
  INSERT INTO businesses (org_id, name, industry, employee_count, annual_revenue)
  VALUES (v_org_id, 'Sunny Lawn Care', 'landscaping', 4, 320000)
  RETURNING id INTO v_business_id;

  INSERT INTO business_profiles (org_id, business_id, business_name, business_type, years_operating, employee_count, location_count, business_hours)
  VALUES (v_org_id, v_business_id, 'Sunny Lawn Care', 'landscaping', 2, 4, 1, 'Mon-Fri 7am-6pm');

  INSERT INTO business_mri (org_id, business_id, version, status, started_at, completed_at)
  VALUES (v_org_id, v_business_id, '1.0.0', 'completed', now() - interval '2 days', now())
  RETURNING id INTO v_mri_id;

  INSERT INTO business_mri_sections (org_id, business_mri_id, section_key, started_at, completed_at)
  SELECT v_org_id, v_mri_id, section_key, now() - interval '2 days', now()
  FROM (VALUES
    ('identity'), ('customers'), ('sales'), ('operations'),
    ('finance'), ('marketing'), ('technology'), ('goals'), ('pain_points')
  ) AS s(section_key);

  INSERT INTO business_mri_responses (org_id, business_mri_id, section_key, question_key, value) VALUES
    (v_org_id, v_mri_id, 'identity', 'identity.business_name', '"Sunny Lawn Care"'),
    (v_org_id, v_mri_id, 'identity', 'identity.business_type', '"landscaping"'),
    (v_org_id, v_mri_id, 'identity', 'identity.years_operating', '2'),
    (v_org_id, v_mri_id, 'identity', 'identity.employees', '4'),
    (v_org_id, v_mri_id, 'identity', 'identity.locations', '1'),
    (v_org_id, v_mri_id, 'customers', 'customers.customer_types', '["b2c"]'),
    (v_org_id, v_mri_id, 'customers', 'customers.acquisition_channels', '["referral","social"]'),
    (v_org_id, v_mri_id, 'customers', 'customers.repeat_business', '4'),
    (v_org_id, v_mri_id, 'customers', 'customers.communication', '["phone","sms"]'),
    (v_org_id, v_mri_id, 'sales', 'sales.lead_sources', '["referral"]'),
    (v_org_id, v_mri_id, 'sales', 'sales.follow_up_process', '"manual"'),
    (v_org_id, v_mri_id, 'sales', 'sales.sales_cycle', '"days"'),
    (v_org_id, v_mri_id, 'sales', 'sales.quote_process', '"manual_document"'),
    (v_org_id, v_mri_id, 'operations', 'operations.scheduling', '"spreadsheet"'),
    (v_org_id, v_mri_id, 'operations', 'operations.daily_tasks', '"checklist"'),
    (v_org_id, v_mri_id, 'operations', 'operations.team_responsibilities', '"informal"'),
    (v_org_id, v_mri_id, 'operations', 'operations.process_documentation', 'false'),
    (v_org_id, v_mri_id, 'finance', 'finance.revenue_sources', '["services"]'),
    (v_org_id, v_mri_id, 'finance', 'finance.invoicing', '"spreadsheet"'),
    (v_org_id, v_mri_id, 'finance', 'finance.collections', '"manual_reminders"'),
    (v_org_id, v_mri_id, 'finance', 'finance.expenses', '"manual_tracking"'),
    (v_org_id, v_mri_id, 'finance', 'finance.cash_flow_visibility', '3'),
    (v_org_id, v_mri_id, 'marketing', 'marketing.website', 'true'),
    (v_org_id, v_mri_id, 'marketing', 'marketing.social_media', '["facebook","instagram"]'),
    (v_org_id, v_mri_id, 'marketing', 'marketing.email_marketing', 'false'),
    (v_org_id, v_mri_id, 'marketing', 'marketing.reviews', '4'),
    (v_org_id, v_mri_id, 'marketing', 'marketing.referral_programs', 'true'),
    (v_org_id, v_mri_id, 'technology', 'technology.crm', 'false'),
    (v_org_id, v_mri_id, 'technology', 'technology.accounting_software', 'true'),
    (v_org_id, v_mri_id, 'technology', 'technology.calendar', 'true'),
    (v_org_id, v_mri_id, 'technology', 'technology.phone', '"personal_cell"'),
    (v_org_id, v_mri_id, 'technology', 'technology.email', '"business_domain"'),
    (v_org_id, v_mri_id, 'technology', 'technology.existing_ai_usage', 'false'),
    (v_org_id, v_mri_id, 'goals', 'goals.priorities', '["growth","automation"]'),
    (v_org_id, v_mri_id, 'pain_points', 'pain_points.challenges', '["missed_leads","outstanding_invoices"]');

  INSERT INTO business_dna (
    org_id, business_id, archetype, growth_stage, operational_complexity, technology_maturity,
    automation_readiness, customer_engagement_style, revenue_model, communication_style, decision_style, risk_profile
  ) VALUES (
    v_org_id, v_business_id, 'owner_operator', 'early_growth', 'moderate', 'basic_tools',
    'moderate', 'relationship_driven', 'service_based', 'high_touch', 'owner_led', 'balanced'
  );

  INSERT INTO business_health (org_id, business_id, overall_score)
  VALUES (v_org_id, v_business_id, 54)
  RETURNING id INTO v_health_id;

  INSERT INTO business_health_dimensions (org_id, business_health_id, dimension_key, score, confidence, trend, evidence, status) VALUES
    (v_org_id, v_health_id, 'sales', 40, 0.7, 'unknown', '["Follow-up process: manual","Pain point reported: Missed Leads"]', 'at_risk'),
    (v_org_id, v_health_id, 'marketing', 67, 0.6, 'unknown', '["Has a website","Runs a referral program"]', 'healthy'),
    (v_org_id, v_health_id, 'operations', 46, 0.6, 'unknown', '["Scheduling: spreadsheet","Team responsibilities: informal"]', 'at_risk'),
    (v_org_id, v_health_id, 'financial', 53, 0.7, 'unknown', '["Invoicing: spreadsheet","Pain point reported: Outstanding Invoices"]', 'at_risk'),
    (v_org_id, v_health_id, 'customer_experience', 80, 0.6, 'unknown', '["Repeat business and reviews scale"]', 'strong'),
    (v_org_id, v_health_id, 'team_productivity', 65, 0.6, 'unknown', '["Daily task tracking: checklist"]', 'healthy'),
    (v_org_id, v_health_id, 'technology', 50, 0.6, 'unknown', '["3/6 technology signals present"]', 'at_risk'),
    (v_org_id, v_health_id, 'growth', 60, 0.6, 'unknown', '["Years operating: 2"]', 'healthy'),
    (v_org_id, v_health_id, 'ai_readiness', 40, 0.6, 'unknown', '["Has foundational software tooling"]', 'at_risk'),
    (v_org_id, v_health_id, 'overall', 54, 0.7, 'unknown', '["Weighted composite of all dimensions."]', 'at_risk');

  INSERT INTO business_capabilities (org_id, business_id, capability_key, current_maturity, business_importance, automation_potential, dependencies, owner) VALUES
    (v_org_id, v_business_id, 'lead_management', 'ad_hoc', 'high', 'medium', '["communication"]', 'unassigned'),
    (v_org_id, v_business_id, 'scheduling', 'developing', 'medium', 'medium', '[]', 'unassigned'),
    (v_org_id, v_business_id, 'customer_management', 'absent', 'medium', 'medium', '["communication"]', 'unassigned'),
    (v_org_id, v_business_id, 'finance', 'developing', 'medium', 'medium', '[]', 'unassigned'),
    (v_org_id, v_business_id, 'operations', 'ad_hoc', 'high', 'medium', '["task_management"]', 'unassigned'),
    (v_org_id, v_business_id, 'reporting', 'developing', 'medium', 'medium', '["finance"]', 'unassigned'),
    (v_org_id, v_business_id, 'communication', 'developing', 'medium', 'medium', '[]', 'unassigned'),
    (v_org_id, v_business_id, 'marketing', 'developing', 'high', 'medium', '["communication"]', 'unassigned'),
    (v_org_id, v_business_id, 'task_management', 'developing', 'medium', 'medium', '[]', 'unassigned');

  INSERT INTO business_timeline (org_id, business_id, type, description, metadata, occurred_at) VALUES
    (v_org_id, v_business_id, 'business_created', 'Business created: Sunny Lawn Care', '{}', now() - interval '3 days'),
    (v_org_id, v_business_id, 'business_mri_started', 'Business MRI started', '{}', now() - interval '2 days'),
    (v_org_id, v_business_id, 'business_mri_completed', 'Business MRI completed', '{}', now()),
    (v_org_id, v_business_id, 'business_dna_generated', 'Business DNA generated', '{}', now()),
    (v_org_id, v_business_id, 'business_health_updated', 'Business Health Graph generated', '{}', now()),
    (v_org_id, v_business_id, 'capability_updated', 'Capability Graph evaluated', '{}', now());
END $$;
