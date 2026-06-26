-- Seeds the registry-driven constraint categories and constraint library
-- (mirrors industry-packs/general-smb/src/data/constraintCategories.ts and
-- constraintLibrary.ts).

INSERT INTO constraint_categories (category_key, label, description) VALUES
  ('sales', 'Sales', 'Lead capture, follow-up, conversion, and quoting.'),
  ('marketing', 'Marketing', 'Visibility, demand generation, and reputation.'),
  ('operations', 'Operations', 'Process consistency, documentation, and delivery.'),
  ('scheduling', 'Scheduling', 'Appointment and resource scheduling discipline.'),
  ('finance', 'Finance', 'Invoicing, collections, and cash flow visibility.'),
  ('customer_experience', 'Customer Experience', 'Retention, responsiveness, and satisfaction.'),
  ('communication', 'Communication', 'Internal and customer-facing communication quality.'),
  ('reporting', 'Reporting', 'KPI tracking and business visibility.'),
  ('staff_productivity', 'Staff Productivity', 'Team accountability and throughput.'),
  ('compliance', 'Compliance', 'Regulatory and policy adherence.'),
  ('technology', 'Technology', 'Tooling coverage and system integration.'),
  ('leadership', 'Leadership', 'Owner dependency and delegation.'),
  ('growth', 'Growth', 'Constraints limiting scale and expansion.');

INSERT INTO constraint_definitions (definition_key, title, description, category_key, default_severity, automation_potential, business_owner) VALUES
  ('missed_leads', 'Missed Leads', 'Inbound leads are not consistently captured, so demand is being lost before it reaches the pipeline.', 'sales', 'high', 'high', 'Sales Owner'),
  ('slow_lead_response', 'Slow Lead Response', 'Lead follow-up is manual or absent, so response time is too slow to convert interested prospects.', 'sales', 'high', 'high', 'Sales Owner'),
  ('poor_lead_qualification', 'Poor Lead Qualification', 'Quoting is verbal/ad hoc, so leads are not consistently qualified before time is invested.', 'sales', 'medium', 'medium', 'Sales Owner'),
  ('weak_customer_follow_up', 'Weak Customer Follow-Up', 'Customer health is below threshold, indicating follow-up after the sale is inconsistent.', 'customer_experience', 'medium', 'high', 'Customer Experience Owner'),
  ('low_customer_retention', 'Low Customer Retention', 'Repeat business and customer experience signals are weak, risking long-term revenue stability.', 'customer_experience', 'high', 'medium', 'Customer Experience Owner'),
  ('manual_scheduling', 'Manual Scheduling', 'Scheduling is run on paper or spreadsheets, creating double-bookings and wasted coordination time.', 'scheduling', 'medium', 'high', 'Operations Owner'),
  ('owner_dependency', 'Owner Dependency', 'Team responsibilities are undefined, so the owner remains the bottleneck for most decisions.', 'leadership', 'high', 'low', 'Business Owner'),
  ('administrative_overload', 'Administrative Overload', 'Administrative work is consuming disproportionate time, reported directly as a pain point.', 'staff_productivity', 'medium', 'high', 'Operations Owner'),
  ('poor_visibility', 'Poor Visibility', 'The business lacks visibility into day-to-day performance, reported directly as a pain point.', 'reporting', 'medium', 'high', 'Business Owner'),
  ('no_kpi_tracking', 'No KPI Tracking', 'Reporting capability is absent or ad hoc, so the business has no consistent way to track KPIs.', 'reporting', 'medium', 'high', 'Business Owner'),
  ('low_review_volume', 'Low Review Volume', 'Marketing health is weak, in part due to low customer review volume hurting reputation and discoverability.', 'marketing', 'low', 'high', 'Marketing Owner'),
  ('outstanding_invoices', 'Outstanding Invoices', 'Unpaid invoices are accumulating, reported directly as a pain point affecting cash flow.', 'finance', 'high', 'high', 'Finance Owner'),
  ('poor_cash_flow_visibility', 'Poor Cash Flow Visibility', 'Cash flow visibility is rated low, making it hard to plan spending and growth investments.', 'finance', 'high', 'medium', 'Finance Owner'),
  ('no_standard_operating_procedures', 'No Standard Operating Procedures', 'Process documentation does not exist, so work quality depends entirely on who performs it.', 'operations', 'medium', 'medium', 'Operations Owner'),
  ('disconnected_systems', 'Disconnected Systems', 'Core systems (CRM, accounting) are missing or not integrated, forcing manual data re-entry.', 'technology', 'medium', 'high', 'Operations Owner'),
  ('duplicate_work', 'Duplicate Work', 'Operations capability is immature, leading to the same work being repeated across disconnected tools.', 'operations', 'low', 'medium', 'Operations Owner'),
  ('no_process_documentation', 'No Process Documentation', 'Task management capability is immature, indicating institutional knowledge lives only in people''s heads.', 'operations', 'medium', 'medium', 'Operations Owner'),
  ('late_customer_responses', 'Late Customer Responses', 'Follow-up process is manual or absent, so customer messages are answered later than expected.', 'communication', 'medium', 'high', 'Customer Experience Owner'),
  ('weak_marketing_consistency', 'Weak Marketing Consistency', 'Email marketing is absent and social presence is unmanaged, so demand generation is inconsistent.', 'marketing', 'low', 'high', 'Marketing Owner'),
  ('unclear_team_accountability', 'Unclear Team Accountability', 'Team responsibilities are undefined or informal, leading to dropped work and unclear ownership.', 'staff_productivity', 'medium', 'low', 'Operations Owner');
