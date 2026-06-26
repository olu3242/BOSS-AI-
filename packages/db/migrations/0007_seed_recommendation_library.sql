-- Seeds the registry-driven recommendation categories and recommendation
-- library (mirrors industry-packs/general-smb/src/data/recommendationCategories.ts
-- and recommendationLibrary.ts).

INSERT INTO recommendation_categories (category_key, label, description) VALUES
  ('sales', 'Sales', 'Recommendations that improve lead capture, follow-up, and conversion.'),
  ('marketing', 'Marketing', 'Recommendations that improve visibility and reputation.'),
  ('operations', 'Operations', 'Recommendations that standardize and document process.'),
  ('customer_experience', 'Customer Experience', 'Recommendations that improve retention and responsiveness.'),
  ('finance', 'Finance', 'Recommendations that improve collections and cash flow visibility.'),
  ('scheduling', 'Scheduling', 'Recommendations that improve appointment discipline.'),
  ('communication', 'Communication', 'Recommendations that improve internal and customer communication.'),
  ('reporting', 'Reporting', 'Recommendations that improve KPI tracking and visibility.'),
  ('technology', 'Technology', 'Recommendations that close tooling and integration gaps.'),
  ('leadership', 'Leadership', 'Recommendations that reduce owner dependency.'),
  ('growth', 'Growth', 'Recommendations that remove constraints limiting scale.'),
  ('compliance', 'Compliance', 'Recommendations that address regulatory or policy gaps.'),
  ('productivity', 'Productivity', 'Recommendations that improve staff throughput and accountability.');

INSERT INTO recommendation_definitions (definition_key, title, description, business_goal, category_key, difficulty, automation_potential, approval, stage) VALUES
  ('lead_follow_up_recovery', 'Lead Follow-Up Recovery', 'Stand up a structured, time-boxed lead follow-up process so new leads are contacted quickly and consistently.', 'Reduce missed and slow-followed-up leads.', 'sales', 'medium', 'high', 'approval_required', 'quick_wins'),
  ('customer_re_engagement', 'Customer Re-engagement', 'Run a scheduled outreach campaign to customers who have gone quiet, with a defined cadence and message templates.', 'Improve customer retention.', 'customer_experience', 'low', 'high', 'auto', 'quick_wins'),
  ('appointment_reminder_automation', 'Appointment Reminder Automation', 'Automate appointment confirmations and reminders to reduce no-shows and scheduling churn.', 'Improve scheduling reliability and reduce no-shows.', 'scheduling', 'medium', 'high', 'approval_required', 'short_term'),
  ('review_request_campaign', 'Review Request Campaign', 'Trigger an automatic review request after every completed job or appointment.', 'Grow online review volume and visibility.', 'marketing', 'low', 'high', 'auto', 'quick_wins'),
  ('invoice_follow_up_automation', 'Invoice Follow-Up Automation', 'Automate reminders for outstanding invoices and surface cash-flow visibility on a regular cadence.', 'Reduce outstanding receivables and improve cash flow visibility.', 'finance', 'medium', 'high', 'approval_required', 'short_term'),
  ('owner_task_delegation', 'Owner Task Delegation', 'Identify owner-dependent tasks and reassign them to staff with clear accountability.', 'Reduce owner dependency and bottlenecking.', 'leadership', 'medium', 'low', 'executive_review', 'medium_term'),
  ('administrative_automation', 'Administrative Automation', 'Automate repetitive administrative tasks and eliminate duplicate manual entry across systems.', 'Free up staff time spent on administrative overhead.', 'operations', 'medium', 'high', 'approval_required', 'short_term'),
  ('customer_communication_improvement', 'Customer Communication Improvement', 'Standardize customer communication channels and response-time expectations.', 'Improve responsiveness and consistency in customer communication.', 'communication', 'low', 'medium', 'auto', 'quick_wins'),
  ('sales_pipeline_standardization', 'Sales Pipeline Standardization', 'Define a standard lead qualification and sales pipeline process with clear stages.', 'Improve lead qualification consistency and sales conversion.', 'sales', 'high', 'medium', 'executive_review', 'medium_term'),
  ('business_kpi_tracking', 'Business KPI Tracking', 'Stand up a lightweight KPI dashboard so the owner can see business performance at a glance.', 'Improve visibility into business performance.', 'reporting', 'medium', 'medium', 'approval_required', 'short_term'),
  ('reporting_automation', 'Reporting Automation', 'Connect disconnected systems and automate recurring reports instead of compiling them manually.', 'Reduce manual reporting effort and improve data consistency.', 'technology', 'high', 'high', 'executive_review', 'strategic'),
  ('knowledge_documentation', 'Knowledge Documentation', 'Document core business processes so they aren''t trapped in one person''s head.', 'Reduce knowledge loss risk and onboarding time.', 'operations', 'medium', 'low', 'approval_required', 'medium_term'),
  ('staff_accountability_program', 'Staff Accountability Program', 'Define clear role ownership and responsibility assignments across the team.', 'Eliminate unclear ownership and duplicate work.', 'productivity', 'medium', 'low', 'executive_review', 'short_term'),
  ('business_process_standardization', 'Business Process Standardization', 'Standardize and connect core operational processes end-to-end instead of running them ad hoc.', 'Build repeatable, scalable operating procedures.', 'growth', 'high', 'medium', 'executive_review', 'strategic'),
  ('marketing_consistency_program', 'Marketing Consistency Program', 'Establish a recurring marketing cadence (email, social, local) instead of sporadic, one-off activity.', 'Build consistent demand generation.', 'marketing', 'medium', 'medium', 'approval_required', 'long_term');
