# WORKFLOW LIBRARY
> Generated: 2026-07-05 | Every automation as configuration, not custom code

All workflows are `WorkflowDefinitionEntry` records registered in `workflowRegistry`.
No workflow contains business logic — it only declares steps (action keys) in order.
All business logic lives in MCP (intelligence) or OS services (execution).

---

## WF-001: Missed Call Lead Capture
**OS Owner**: Communication OS → Customer OS
**Trigger**: Event — `communication.missed_call.detected`

```
TRIGGER: communication.missed_call.detected
  │
  ├── STEP 1: CreateLead                          [ACT-060]
  │   input: { caller_phone, business_id, source: "missed_call" }
  │
  ├── STEP 2: QualifyLead (AI)                   [ACT-061 + ACT-040]
  │   input: { lead_id, business_context }
  │
  ├── STEP 3: AssignOwner                         [ACT-062]
  │   input: { lead_id, assignment_rules }
  │
  ├── STEP 4: SendSMS to caller                   [ACT-030]
  │   input: { phone: caller_phone, template: "missed_call_response" }
  │
  └── STEP 5: CreateTask for rep                  [ACT-010 variant]
      input: { assignee: owner_id, lead_id, due_in_minutes: 60 }
```

---

## WF-002: Appointment Reminder
**OS Owner**: Work OS
**Trigger**: Schedule — 24h before appointment AND 2h before appointment

```
TRIGGER: scheduler (24h before appointment.scheduled_time)
  │
  ├── STEP 1: SendSMS reminder                    [ACT-030]
  │   input: { customer_phone, appointment_id, template: "reminder_24h" }
  │
  └── STEP 2: SendEmail reminder                  [ACT-031]
      input: { customer_email, appointment_id, template: "reminder_24h" }

TRIGGER: scheduler (2h before appointment.scheduled_time)
  │
  └── STEP 1: SendSMS final reminder              [ACT-030]
      input: { customer_phone, appointment_id, template: "reminder_2h" }
```

---

## WF-003: Post-Job Review Request
**OS Owner**: Customer OS
**Trigger**: Event — `job.completed`

```
TRIGGER: job.completed
  │
  ├── STEP 1: Wait 2 hours                        (delay step)
  │
  ├── STEP 2: SendSMS review request              [ACT-030]
  │   input: { customer_phone, job_id, template: "review_request" }
  │
  └── STEP 3: SendEmail review request            [ACT-031]
      input: { customer_email, job_id, template: "review_request" }
```

---

## WF-004: Customer Re-engagement
**OS Owner**: Customer OS → Growth OS
**Trigger**: Event — `customer.inactive.detected` (90-day inactivity)

```
TRIGGER: customer.inactive.detected
  │
  ├── STEP 1: RunAIAnalysis — personalize message [ACT-040]
  │   input: { customer_id, interaction_history }
  │
  ├── STEP 2: SendEmail campaign                  [ACT-031]
  │   input: { customer_email, personalized_offer }
  │
  ├── STEP 3: SendSMS campaign                    [ACT-030]
  │   input: { customer_phone, short_message }
  │
  └── STEP 4: UpdateKPI                           [ACT-024]
      input: { kpi: "re_engagement_campaigns_sent" }
```

---

## WF-005: Invoice Generation After Job Completion
**OS Owner**: Money OS
**Trigger**: Event — `job.completed`

```
TRIGGER: job.completed
  │
  ├── STEP 1: GenerateInvoice                     [ACT-020]
  │   input: { job_id, customer_id, line_items_from_job }
  │
  ├── STEP 2: [Approval Gate] — if invoice > $5,000 [ACT-052]
  │   input: { invoice_id, approver: business_owner }
  │   on_approve: continue to STEP 3
  │   on_reject: archive invoice
  │
  ├── STEP 3: SendInvoice                         [ACT-021]
  │   input: { invoice_id, customer_email }
  │
  └── STEP 4: UpdateKPI                           [ACT-024]
      input: { kpi: "invoices_sent_count" }
```

---

## WF-006: Invoice Overdue Follow-up
**OS Owner**: Money OS
**Trigger**: Schedule — daily check for overdue invoices

```
TRIGGER: scheduler (daily 09:00 UTC)
  │
  ├── STEP 1: Detect overdue invoices             [ACT-042 variant]
  │   input: { overdue_threshold_days: 7 }
  │
  ├── FOR EACH overdue invoice:
  │   ├── STEP 2: SendEmail reminder              [ACT-031]
  │   │   input: { customer_email, invoice_id, template: "overdue_7d" }
  │   │
  │   └── STEP 3: [if > 30 days] RequestApproval to write off [ACT-052]
  │
  └── STEP 4: UpdateKPI                           [ACT-024]
      input: { kpi: "overdue_invoice_count" }
```

---

## WF-007: Payment Received → Update Revenue
**OS Owner**: Money OS
**Trigger**: Event — `payment.received`

```
TRIGGER: payment.received
  │
  ├── STEP 1: MarkInvoicePaid                     [ACT-022]
  │   input: { invoice_id, payment_id }
  │
  ├── STEP 2: UpdateKPI                           [ACT-024]
  │   input: { kpi: "monthly_revenue", delta: amount }
  │
  ├── STEP 3: PublishDashboard                    [ACT-072]
  │
  └── STEP 4: TriggerWorkflow — ReferralProgram   [ACT-053]
      condition: if first_payment_for_new_customer
      input: { customer_id, invoice_id }
```

---

## WF-008: Estimate Acceptance → Job Creation
**OS Owner**: Work OS → Money OS
**Trigger**: Event — `estimate.accepted`

```
TRIGGER: estimate.accepted
  │
  ├── STEP 1: CreateJob                           [ACT-010]
  │   input: { estimate_id, customer_id, service_type }
  │
  ├── STEP 2: CreateAppointment                   [ACT-013]
  │   input: { job_id, preferred_dates }
  │
  └── STEP 3: SendSMS confirmation to customer    [ACT-030]
      input: { customer_phone, template: "estimate_accepted" }
```

---

## WF-009: Technician Dispatch
**OS Owner**: Work OS
**Trigger**: Event — `job.approved`

```
TRIGGER: job.approved
  │
  ├── STEP 1: RunAIAnalysis — find best technician [ACT-040]
  │   input: { job_id, required_skills, service_area, availability }
  │
  ├── STEP 2: AssignTechnician                    [ACT-011]
  │   input: { job_id, technician_id }
  │
  ├── STEP 3: CreateAppointment                   [ACT-013]
  │   input: { job_id, technician_id, scheduled_time }
  │
  └── STEP 4: SendSMS to technician               [ACT-030]
      input: { tech_phone, template: "job_assigned", job_id }
```

---

## WF-010: Lead Qualification & Assignment
**OS Owner**: Growth OS
**Trigger**: Event — `lead.created`

```
TRIGGER: lead.created
  │
  ├── STEP 1: QualifyLead (AI scoring)            [ACT-061 + ACT-040]
  │   input: { lead_id, source, business_context }
  │
  ├── STEP 2: AssignOwner                         [ACT-062]
  │   input: { lead_id, assignment_rules }
  │
  ├── STEP 3: SendSMS/Email to rep               [ACT-030 / ACT-031]
  │   input: { rep_contact, lead_summary }
  │
  └── STEP 4: SyncToProvider (CRM)               [ACT-073]
      input: { provider: "hubspot", lead_id }
```

---

## WF-011: Referral Program Trigger
**OS Owner**: Growth OS
**Trigger**: Triggered by WF-007 (first payment from new customer)

```
TRIGGER: workflow.trigger (from WF-007)
  │
  ├── STEP 1: SendEmail referral request         [ACT-031]
  │   input: { customer_email, template: "referral_ask" }
  │
  └── STEP 2: UpdateKPI                          [ACT-024]
      input: { kpi: "referral_requests_sent" }
```

---

## WF-012: New Customer Onboarding
**OS Owner**: Customer OS
**Trigger**: Event — `customer.created`

```
TRIGGER: customer.created
  │
  ├── STEP 1: SendEmail welcome                  [ACT-031]
  │   input: { customer_email, template: "welcome" }
  │
  ├── STEP 2: SyncToProvider (CRM)              [ACT-073]
  │   input: { provider: "hubspot", customer_id }
  │
  └── STEP 3: UpdateKPI                         [ACT-024]
      input: { kpi: "new_customers_this_month" }
```

---

## WF-013: Weekly Executive Briefing
**OS Owner**: Intelligence OS
**Trigger**: Schedule — Monday 07:00 UTC

```
TRIGGER: scheduler (0 7 * * MON)
  │
  ├── STEP 1: RunKPIMeasurement                  [ACT-042]
  │
  ├── STEP 2: GenerateBriefing (AI)              [ACT-043]
  │   input: { business_id, reporting_period: "weekly" }
  │
  └── STEP 3: SendEmail briefing to owner        [ACT-031]
      input: { owner_email, briefing_id, template: "weekly_briefing" }
```

---

## WF-014: KPI Threshold Alert
**OS Owner**: Intelligence OS
**Trigger**: Event — `kpi.threshold.exceeded`

```
TRIGGER: kpi.threshold.exceeded
  │
  ├── STEP 1: GenerateRecommendation             [ACT-041]
  │   input: { kpi_key, current_value, threshold }
  │
  ├── STEP 2: CreateDecision                     [ACT-050]
  │   input: { decision_type: "operational", kpi_key }
  │
  └── STEP 3: CreateNotification to owner        [ACT-033]
      input: { owner_id, type: "kpi_alert", kpi_key, value }
```

---

## WF-015: BTE Daily Business Cycle
**OS Owner**: Decision OS → Intelligence OS
**Trigger**: Schedule — 06:00 UTC daily (per business)

```
TRIGGER: scheduler (0 6 * * *)
  │
  ├── PHASE 1: OBSERVE — RunKPIMeasurement       [ACT-042]
  ├── PHASE 2: ANALYZE — RunDiagnostic           [ACT-044]
  ├── PHASE 3: DECIDE — CreateDecision           [ACT-050]
  ├── PHASE 4: PLAN — executionPlanService        (auto)
  ├── PHASE 5: EXECUTE — TriggerWorkflow(s)       [ACT-053]
  ├── PHASE 6: VERIFY — outcomeVerificationService (auto)
  └── PHASE 7: LEARN — AI memory update           [ACT-040]
```

**Certification: PASS — fully implemented**

---

## Workflow Registry Status

| Workflow | Status |
|----------|--------|
| WF-001 Missed Call | BLOCKED (leads entity missing) |
| WF-002 Appointment Reminder | PARTIAL (notificationService missing) |
| WF-003 Review Request | PARTIAL (job.completed event missing) |
| WF-004 Re-engagement | PARTIAL (inactive detection missing) |
| WF-005 Invoice Generation | PARTIAL (job.completed event missing) |
| WF-006 Overdue Follow-up | PARTIAL (overdue detection + notificationService) |
| WF-007 Payment → Revenue | PARTIAL (payment.received event missing) |
| WF-008 Estimate → Job | BLOCKED (estimate entity missing) |
| WF-009 Technician Dispatch | BLOCKED (staff entity missing) |
| WF-010 Lead Qualification | BLOCKED (lead entity missing) |
| WF-011 Referral Program | PARTIAL (referral service missing) |
| WF-012 Customer Onboarding | PARTIAL (customer.created event missing) |
| WF-013 Weekly Briefing | PARTIAL (weekly cron + notificationService) |
| WF-014 KPI Alert | PARTIAL (threshold detection missing) |
| WF-015 BTE Daily Cycle | **PASS — ACTIVE** |
