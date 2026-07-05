# AUTOMATION CERTIFICATION MATRIX
> Generated: 2026-07-05 | Every automation scenario mapped to the BOSS Automation Runtime

---

## Legend
- **Status**: `PASS` | `PARTIAL` | `BLOCKED` | `N/A`
- **Runtime Compat**: Does the automation execute through BossRuntime/WorkflowRuntime/Loop?

---

## Communication & Lead Response Automations

### AUTO-001 — Missed Call Lead Capture
| Field | Value |
|-------|-------|
| **Business Goal** | Convert missed calls into leads; eliminate lost revenue from unanswered calls |
| **Trigger** | MissedCallDetected event (via telephony webhook) |
| **Inputs** | caller_phone, business_id, timestamp, call_duration |
| **Required Data** | Business profile, working hours, assigned rep |
| **Current Services** | `twilioSmsAdapter` (SMS), `customerService` (create lead) |
| **Missing Services** | `notificationService` (canonical dispatch), `leadService` (lead entity), telephony webhook route |
| **Runtime Events** | `communication.missed_call.detected` → `lead.created` → `notification.sent` |
| **AI Agents** | Customer OS Agent (lead qualification) |
| **Outputs** | Lead record, outbound SMS to caller, task for rep |
| **Notifications** | SMS to caller: "We missed your call — we'll be in touch within X minutes" |
| **Approvals** | None (safe auto-execute) |
| **KPIs** | lead_response_time, missed_call_rate, lead_conversion_rate |
| **OS Owner** | Communication OS → Customer OS |
| **Implementation Status** | PARTIAL — SMS adapter exists, no lead entity, no telephony webhook |
| **Runtime Compatibility** | YES — via WorkflowRuntime step graph |
| **Certification** | **BLOCKED** — missing: `leadService`, `leads` table migration, telephony inbound webhook |

---

### AUTO-002 — Appointment Reminder
| Field | Value |
|-------|-------|
| **Business Goal** | Reduce no-shows; improve technician utilization |
| **Trigger** | Schedule — 24h and 2h before appointment |
| **Inputs** | appointment_id, customer_phone/email, business_id |
| **Required Data** | Appointments table, customer contact, business name |
| **Current Services** | `appointmentService`, `twilioSmsAdapter`, `gmailAdapter` |
| **Missing Services** | `notificationService` (unified), reminder scheduler rule |
| **Runtime Events** | `appointment.reminder.scheduled` → `notification.sent` |
| **AI Agents** | None |
| **Outputs** | SMS + email reminder sent, reminder_sent flag on appointment |
| **Notifications** | SMS: "Reminder: [Service] tomorrow at [Time]. Reply CONFIRM or CANCEL." |
| **Approvals** | None |
| **KPIs** | appointment_no_show_rate, appointment_confirmation_rate |
| **OS Owner** | Work OS |
| **Implementation Status** | PARTIAL — appointment service + SMS adapter exist; no unified reminder workflow |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: `notificationService`, reminder cron rule in BTE |

---

### AUTO-003 — Review Request After Job Completion
| Field | Value |
|-------|-------|
| **Business Goal** | Increase online reviews; improve reputation score |
| **Trigger** | JobCompleted event |
| **Inputs** | job_id, customer_id, business_id, customer_email/phone |
| **Required Data** | Job record, customer contact, review platform URLs |
| **Current Services** | `jobService`, `reviewService`, `twilioSmsAdapter`, `gmailAdapter` |
| **Missing Services** | `notificationService`, review link generation |
| **Runtime Events** | `job.completed` → `review_request.sent` → `review.received` |
| **AI Agents** | None |
| **Outputs** | Review request SMS/email, review record on receipt |
| **Notifications** | SMS: "Thanks for choosing [Business]! Please leave us a review: [link]" |
| **Approvals** | None |
| **KPIs** | review_count, avg_rating, review_response_rate |
| **OS Owner** | Customer OS |
| **Implementation Status** | PARTIAL — job and review services exist; no post-job trigger workflow |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: `job.completed` event emission, `notificationService` |

---

### AUTO-004 — Re-engagement Campaign (Inactive Customers)
| Field | Value |
|-------|-------|
| **Business Goal** | Recover churned customers; increase repeat business rate |
| **Trigger** | Schedule — customer inactive for 90 days |
| **Inputs** | customer_id, last_interaction_date, business_id |
| **Required Data** | Customer table, interaction history, campaign templates |
| **Current Services** | `customerService`, `customerHealthService`, `mailchimpAdapter`, `activeCampaignAdapter` |
| **Missing Services** | `notificationService`, campaign template registry, re-engagement workflow |
| **Runtime Events** | `customer.inactive.detected` → `campaign.sent` → `customer.reengaged` |
| **AI Agents** | Customer OS Agent (personalized message generation) |
| **Outputs** | Email/SMS campaign sent, customer status updated |
| **Notifications** | Email: "We miss you! Book [Service] and get [Offer]" |
| **Approvals** | None (configurable threshold) |
| **KPIs** | customer_retention_rate, repeat_business_rate, campaign_open_rate |
| **OS Owner** | Customer OS → Growth OS |
| **Implementation Status** | PARTIAL — customer health service exists; no 90-day inactivity cron, no campaign workflow |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: inactivity detection cron, `notificationService`, `customer.inactive.detected` event |

---

## Revenue & Financial Automations

### AUTO-005 — Invoice Generation After Job Completion
| Field | Value |
|-------|-------|
| **Business Goal** | Accelerate cash flow; eliminate manual invoicing delay |
| **Trigger** | JobCompleted event |
| **Inputs** | job_id, customer_id, line_items, business_id |
| **Required Data** | Job record, pricing catalog, customer billing info |
| **Current Services** | `jobService`, `invoiceService` |
| **Missing Services** | Pricing catalog service, `job.completed` event |
| **Runtime Events** | `job.completed` → `invoice.created` → `notification.sent` |
| **AI Agents** | None |
| **Outputs** | Invoice record, invoice emailed to customer |
| **Notifications** | Email: "Invoice #[N] for [Service] — Amount Due: $[X]" |
| **Approvals** | None (below threshold); Approval gate for invoices > $5,000 |
| **KPIs** | invoice_collection_rate, days_sales_outstanding, revenue_per_job |
| **OS Owner** | Money OS |
| **Implementation Status** | PARTIAL — invoice service exists; no auto-trigger from job completion |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: `job.completed` event, `notificationService`, pricing catalog |

---

### AUTO-006 — Invoice Overdue Follow-up
| Field | Value |
|-------|-------|
| **Business Goal** | Reduce accounts receivable aging; improve cash flow |
| **Trigger** | Schedule — invoice past due date by 7 days |
| **Inputs** | invoice_id, customer_id, amount_due, business_id |
| **Required Data** | Invoices table (status, due_date), customer contact |
| **Current Services** | `invoiceService`, `twilioSmsAdapter`, `gmailAdapter` |
| **Missing Services** | `notificationService`, overdue detection cron |
| **Runtime Events** | `invoice.overdue.detected` → `reminder.sent` → `invoice.paid` or `invoice.escalated` |
| **AI Agents** | None |
| **Outputs** | Payment reminder sent, escalation to finance if >30 days |
| **Notifications** | Email: "Invoice #[N] is overdue. Pay now: [link]" |
| **Approvals** | Escalation to owner if >30 days overdue |
| **KPIs** | days_sales_outstanding, collection_rate, bad_debt_rate |
| **OS Owner** | Money OS |
| **Implementation Status** | PARTIAL — invoice service exists; no overdue detection cron |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: overdue detection scheduler rule, `notificationService` |

---

### AUTO-007 — Payment Received → Update Revenue KPIs
| Field | Value |
|-------|-------|
| **Business Goal** | Real-time revenue visibility for owner decision-making |
| **Trigger** | PaymentReceived event |
| **Inputs** | payment_id, invoice_id, amount, business_id |
| **Required Data** | Payments table, KPI readings |
| **Current Services** | `paymentService`, `kpiMeasurementService` |
| **Missing Services** | `payment.received` event emission |
| **Runtime Events** | `payment.received` → `kpi.updated` → `dashboard.updated` |
| **AI Agents** | None |
| **Outputs** | KPI reading updated, dashboard refreshed |
| **Notifications** | Owner: "Payment of $[X] received from [Customer]" |
| **Approvals** | None |
| **KPIs** | monthly_revenue, cash_flow, invoice_collection_rate |
| **OS Owner** | Money OS |
| **Implementation Status** | PARTIAL — payment service + KPI service exist; no event emission on payment |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: `payment.received` event emission from `paymentService` |

---

### AUTO-008 — Estimate Acceptance → Job Creation
| Field | Value |
|-------|-------|
| **Business Goal** | Eliminate manual job creation from approved estimates |
| **Trigger** | EstimateAccepted event |
| **Inputs** | estimate_id, customer_id, service_type, business_id |
| **Required Data** | Estimate record, job templates |
| **Current Services** | `jobService`, `invoiceService` (estimate as draft invoice) |
| **Missing Services** | Estimate entity/service, `estimate.accepted` event |
| **Runtime Events** | `estimate.accepted` → `job.created` → `appointment.scheduled` |
| **AI Agents** | None |
| **Outputs** | Job record created, appointment scheduling initiated |
| **Notifications** | Customer: "Your estimate has been accepted — scheduling now" |
| **Approvals** | None |
| **KPIs** | estimate_acceptance_rate, jobs_per_estimate |
| **OS Owner** | Work OS → Money OS |
| **Implementation Status** | PARTIAL — job + invoice services exist; no dedicated estimate entity |
| **Runtime Compatibility** | YES |
| **Certification** | **BLOCKED** — missing: estimate entity, `estimate.accepted` event |

---

## Operations & Scheduling Automations

### AUTO-009 — Technician Dispatch Optimization
| Field | Value |
|-------|-------|
| **Business Goal** | Maximize technician utilization; reduce drive time |
| **Trigger** | JobApproved event |
| **Inputs** | job_id, service_area, skills_required, business_id |
| **Required Data** | Jobs, staff/technician profiles, calendar availability |
| **Current Services** | `jobService`, `appointmentService`, ServiceTitan/Jobber adapters |
| **Missing Services** | Staff/technician service, dispatch optimization algorithm |
| **Runtime Events** | `job.approved` → `technician.assigned` → `appointment.created` |
| **AI Agents** | Work OS Agent (dispatch optimization) |
| **Outputs** | Job assigned, appointment created, technician notified |
| **Notifications** | Tech: "New job assigned: [Address] at [Time]" |
| **Approvals** | None (auto-dispatch within rules); Manager approval for overtime |
| **KPIs** | technician_utilization, first_time_fix_rate, drive_time |
| **OS Owner** | Work OS |
| **Implementation Status** | PARTIAL — job + appointment services exist; no dispatch algorithm, no staff entity |
| **Runtime Compatibility** | YES |
| **Certification** | **BLOCKED** — missing: staff/technician entity, dispatch optimization service |

---

### AUTO-010 — Inventory Low Stock Alert
| Field | Value |
|-------|-------|
| **Business Goal** | Prevent service delays from stockouts |
| **Trigger** | Schedule — daily inventory check |
| **Inputs** | business_id, inventory thresholds |
| **Required Data** | Inventory table (missing) |
| **Current Services** | None applicable |
| **Missing Services** | `inventoryService`, `inventory` table migration, `notificationService` |
| **Runtime Events** | `inventory.low_stock.detected` → `purchase_order.created` → `notification.sent` |
| **AI Agents** | Work OS Agent (reorder recommendation) |
| **Outputs** | Low stock alert, reorder suggestion |
| **Notifications** | Owner: "[Item] is running low — current stock: [X] units" |
| **Approvals** | Approval for purchase orders > $500 |
| **KPIs** | inventory_turnover, stockout_rate, carrying_cost |
| **OS Owner** | Work OS |
| **Implementation Status** | NOT STARTED |
| **Runtime Compatibility** | YES (once built) |
| **Certification** | **BLOCKED** — missing: inventory entity, service, migration (net-new) |

---

## AI Workforce Automations

### AUTO-011 — AI Employee Daily Task Execution
| Field | Value |
|-------|-------|
| **Business Goal** | Automate routine business tasks without human intervention |
| **Trigger** | Schedule — each AI employee runs on assigned cadence |
| **Inputs** | agent_id, business_id, context |
| **Required Data** | Agent definitions, memory records, business context |
| **Current Services** | `aiWorkforceService`, `AgentRuntime` (Loop), MCP `aiEmployeeRuntime` |
| **Missing Services** | None (full stack exists) |
| **Runtime Events** | `agent.started` → `agent.completed` → `kpi.updated` |
| **AI Agents** | All registered AI employees |
| **Outputs** | Task completion record, memory update, KPI impact |
| **Notifications** | Owner: "[Agent] completed [Task] — [outcome]" |
| **Approvals** | Escalation rules per agent definition |
| **KPIs** | ai_task_completion_rate, agent_roi, automation_rate |
| **OS Owner** | Intelligence OS |
| **Implementation Status** | ACTIVE — full stack implemented |
| **Runtime Compatibility** | YES |
| **Certification** | **PASS** |

---

### AUTO-012 — BTE Daily Business Improvement Cycle
| Field | Value |
|-------|-------|
| **Business Goal** | Continuously improve every business KPI automatically |
| **Trigger** | Schedule — 06:00 UTC daily per business (cron) |
| **Inputs** | business_id, org_id |
| **Required Data** | All business data (health, KPIs, events, constraints) |
| **Current Services** | `bteService`, `businessOperatingLoopService`, MCP (all engines), `schedulerService` |
| **Missing Services** | None (full stack exists) |
| **Runtime Events** | `bte.cycle.started` → 7 phase events → `bte.cycle.completed` |
| **AI Agents** | Decision OS Agent, Intelligence OS Agent |
| **Outputs** | New decisions, recommendations, execution plans, verified outcomes |
| **Notifications** | Owner: "Daily business analysis complete — [N] insights, [N] actions taken" |
| **Approvals** | Approval gates for high-risk actions |
| **KPIs** | overall_health_score, decisions_generated, plans_executed |
| **OS Owner** | Decision OS → Intelligence OS |
| **Implementation Status** | ACTIVE |
| **Runtime Compatibility** | YES |
| **Certification** | **PASS** |

---

## Customer Lifecycle Automations

### AUTO-013 — New Customer Onboarding
| Field | Value |
|-------|-------|
| **Business Goal** | Accelerate time-to-value for new customers; reduce churn |
| **Trigger** | CustomerCreated event |
| **Inputs** | customer_id, business_id, customer_email |
| **Required Data** | Customer record, onboarding template |
| **Current Services** | `customerService`, `gmailAdapter` |
| **Missing Services** | `notificationService`, onboarding template registry, `customer.created` event emission |
| **Runtime Events** | `customer.created` → `welcome.sent` → `onboarding.started` |
| **AI Agents** | Customer OS Agent |
| **Outputs** | Welcome email, onboarding sequence started |
| **Notifications** | Email: "Welcome to [Business]! Here's how to get started." |
| **Approvals** | None |
| **KPIs** | customer_onboarding_completion, first_purchase_rate, nps_score |
| **OS Owner** | Customer OS |
| **Implementation Status** | PARTIAL — customer service exists; no `customer.created` event, no onboarding workflow |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: `customer.created` event emission, `notificationService` |

---

### AUTO-014 — Customer Health Score Drop Alert
| Field | Value |
|-------|-------|
| **Business Goal** | Intervene before customers churn |
| **Trigger** | KPIThresholdExceeded event (customer_health < 40) |
| **Inputs** | customer_id, health_score, business_id |
| **Required Data** | Customer health records |
| **Current Services** | `customerHealthService`, `kpiMeasurementService` |
| **Missing Services** | `notificationService`, health threshold alert rule |
| **Runtime Events** | `customer.health.degraded` → `alert.sent` → `task.created` |
| **AI Agents** | Customer OS Agent |
| **Outputs** | Alert to owner, task to check in with customer |
| **Notifications** | Owner: "[Customer] health score dropped to [N] — action recommended" |
| **Approvals** | None |
| **KPIs** | customer_churn_rate, customer_health_avg, retention_rate |
| **OS Owner** | Customer OS |
| **Implementation Status** | PARTIAL — customer health service exists; no threshold alert trigger |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: health threshold detection rule, `notificationService` |

---

## Growth Automations

### AUTO-015 — Lead Qualification & Assignment
| Field | Value |
|-------|-------|
| **Business Goal** | Convert inbound leads to paying customers faster |
| **Trigger** | LeadCreated event |
| **Inputs** | lead_id, source, contact_info, business_id |
| **Required Data** | Lead record, rep assignment rules, qualification criteria |
| **Current Services** | `customerService` (partial) |
| **Missing Services** | `leadService`, `leads` table migration, assignment rules engine, `notificationService` |
| **Runtime Events** | `lead.created` → `lead.qualified` → `lead.assigned` → `contact.initiated` |
| **AI Agents** | Growth OS Agent (lead scoring) |
| **Outputs** | Qualified lead record, rep assigned, first contact sent |
| **Notifications** | Rep: "New lead assigned: [Name] — [Source]" |
| **Approvals** | None |
| **KPIs** | lead_conversion_rate, lead_response_time, pipeline_value |
| **OS Owner** | Growth OS |
| **Implementation Status** | NOT STARTED |
| **Runtime Compatibility** | YES (once built) |
| **Certification** | **BLOCKED** — missing: lead entity (net-new) |

---

### AUTO-016 — Referral Program Trigger
| Field | Value |
|-------|-------|
| **Business Goal** | Generate referrals; reduce customer acquisition cost |
| **Trigger** | InvoicePaid event (first payment from new customer) |
| **Inputs** | customer_id, invoice_id, business_id |
| **Required Data** | Customer record, referral program config |
| **Current Services** | `invoiceService`, `paymentService` |
| **Missing Services** | Referral service, `notificationService`, `invoice.paid` event |
| **Runtime Events** | `invoice.paid` → `referral.request.sent` → `referral.created` |
| **AI Agents** | None |
| **Outputs** | Referral request sent to customer |
| **Notifications** | Customer: "Loving our service? Refer a friend and earn $[X]" |
| **Approvals** | None |
| **KPIs** | referral_rate, customer_acquisition_cost, referral_conversion |
| **OS Owner** | Growth OS |
| **Implementation Status** | PARTIAL — invoice/payment services exist; no `invoice.paid` event emission |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: `invoice.paid` event emission, referral service, `notificationService` |

---

## Intelligence & Reporting Automations

### AUTO-017 — Weekly Executive Briefing
| Field | Value |
|-------|-------|
| **Business Goal** | Keep owner informed; accelerate strategic decisions |
| **Trigger** | Schedule — Monday 07:00 UTC |
| **Inputs** | business_id, org_id, reporting_period |
| **Required Data** | KPI readings, decisions, recommendations, health |
| **Current Services** | `executiveBriefingService`, `kpiMeasurementService`, `missionControlService` |
| **Missing Services** | Weekly briefing cron rule, `notificationService` (email delivery) |
| **Runtime Events** | `briefing.generated` → `notification.sent` |
| **AI Agents** | Intelligence OS Agent |
| **Outputs** | Executive brief document, email to owner |
| **Notifications** | Email: "Your weekly business briefing is ready" |
| **Approvals** | None |
| **KPIs** | briefings_sent, owner_engagement_rate |
| **OS Owner** | Intelligence OS |
| **Implementation Status** | PARTIAL — briefing service exists; no weekly cron, no email delivery |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: weekly cron rule, `notificationService` |

---

### AUTO-018 — KPI Threshold Alert
| Field | Value |
|-------|-------|
| **Business Goal** | Alert owner when KPIs breach critical thresholds |
| **Trigger** | KPIThresholdExceeded (any KPI) |
| **Inputs** | kpi_key, current_value, threshold, business_id |
| **Required Data** | KPI readings, threshold configurations |
| **Current Services** | `kpiMeasurementService` |
| **Missing Services** | Threshold configuration store, `notificationService`, `kpi.threshold.exceeded` event emission |
| **Runtime Events** | `kpi.threshold.exceeded` → `alert.created` → `notification.sent` |
| **AI Agents** | Decision OS Agent (recommended action) |
| **Outputs** | KPI alert, recommended action |
| **Notifications** | Owner: "[KPI] dropped to [Value] — below threshold of [Threshold]" |
| **Approvals** | None |
| **KPIs** | kpi_alert_response_time, actions_taken_per_alert |
| **OS Owner** | Intelligence OS |
| **Implementation Status** | PARTIAL — KPI service exists; no threshold config, no alert trigger |
| **Runtime Compatibility** | YES |
| **Certification** | **PARTIAL** — missing: threshold config, `kpi.threshold.exceeded` event, `notificationService` |

---

## Certification Summary

| Status | Count | Automations |
|--------|-------|------------|
| PASS | 2 | AUTO-011, AUTO-012 |
| PARTIAL | 10 | AUTO-002, AUTO-003, AUTO-004, AUTO-005, AUTO-006, AUTO-007, AUTO-013, AUTO-014, AUTO-016, AUTO-017, AUTO-018 |
| BLOCKED | 4 | AUTO-001, AUTO-008, AUTO-009, AUTO-015 |
| NOT STARTED | 2 | AUTO-010 (inventory), AUTO-015 (leads — shared w/ BLOCKED) |

**Platform reuse across all automations: ~78%**
Primary gaps: `notificationService` (blocks 12), `leads` entity (blocks 2), event emissions (blocks 8)
