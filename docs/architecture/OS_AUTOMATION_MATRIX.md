# OS AUTOMATION MATRIX
> Generated: 2026-07-05 | Every automation owned by exactly one OS module

---

## OS Ownership Rules
1. Each automation has ONE primary OS owner
2. Cross-OS automations use orchestration (TriggerWorkflow) — never duplicate ownership
3. The trigger OS initiates; downstream OS modules are consumers only

---

## Customer OS

**Mission**: Own every customer relationship. Maximize lifetime value and retention.

**KPIs Owned**: customer_lifetime_value, retention_rate, nps_score, avg_response_time, churn_rate

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| New customer onboarding | WF-012 | customer.created | → Growth OS (CRM sync) |
| Customer re-engagement | WF-004 | customer.inactive.detected | → Communication OS (send) |
| Customer health alert | WF-014 variant | customer.health.degraded | → Decision OS (create task) |
| Post-job review request | WF-003 | job.completed | Work OS triggers, Customer OS executes |
| Missed call lead capture | WF-001 | communication.missed_call | Communication OS triggers, Customer OS creates lead |

**Services**: `customerService`, `customerHealthService`, `reviewService`
**AI Agents**: Customer OS Agent (re-engagement, onboarding personalization)
**Provider Adapters**: HubSpot, Salesforce, ActiveCampaign (CRM sync)

---

## Growth OS

**Mission**: Fill the pipeline. Acquire customers profitably. Expand accounts.

**KPIs Owned**: lead_conversion_rate, customer_acquisition_cost, pipeline_value, referral_rate

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| Lead qualification & assignment | WF-010 | lead.created | → Communication OS (notify rep) |
| Referral program trigger | WF-011 | invoice.paid (Money OS) | Money OS triggers, Growth OS executes |
| Email campaign re-engagement | WF-004 partial | customer.inactive | Customer OS triggers, Growth OS sends |

**Services**: `leadService` [CREATE], referralService [CREATE]
**AI Agents**: Growth OS Agent (lead scoring, campaign personalization)
**Provider Adapters**: HubSpot, Salesforce, Mailchimp, ActiveCampaign

---

## Money OS

**Mission**: Maximize revenue. Accelerate cash flow. Eliminate financial leakage.

**KPIs Owned**: monthly_revenue, cash_flow, invoice_collection_rate, days_sales_outstanding, gross_margin

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| Invoice generation after job | WF-005 | job.completed (Work OS) | Work OS triggers, Money OS executes |
| Invoice overdue follow-up | WF-006 | scheduler (daily) | Money OS owns end-to-end |
| Payment received → revenue | WF-007 | payment.received | → Growth OS (referral), → Intelligence OS (KPI) |
| Estimate acceptance → job | WF-008 | estimate.accepted | → Work OS (create job) |

**Services**: `invoiceService`, `paymentService`
**AI Agents**: Money OS Agent (payment prediction, overdue risk scoring)
**Provider Adapters**: Stripe, QuickBooks, Xero

---

## Work OS

**Mission**: Run operations at peak efficiency. Maximize utilization. Eliminate waste.

**KPIs Owned**: technician_utilization, jobs_completed, first_time_fix_rate, avg_job_duration

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| Appointment reminder | WF-002 | scheduler (before appointment) | → Communication OS (send) |
| Technician dispatch | WF-009 | job.approved | Work OS owns end-to-end |
| Estimate acceptance → job | WF-008 | estimate.accepted | Work OS creates job → Money OS tracks |
| Inventory low stock alert | WF-010 variant | scheduler (daily) | → Decision OS (approval for PO) |

**Services**: `jobService`, `appointmentService`
**AI Agents**: Work OS Agent (dispatch optimization, scheduling)
**Provider Adapters**: ServiceTitan, Jobber, Google Calendar, Outlook Calendar

---

## Communication OS

**Mission**: Every communication reaches the right person, on the right channel, at the right time.

**KPIs Owned**: message_delivery_rate, open_rate, response_rate, missed_call_rate

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| Missed call lead capture | WF-001 | communication.missed_call | Communication OS detects, → Customer OS creates lead |
| All notification dispatch | (action library) | All OS triggers | Communication OS is shared infrastructure |

**Services**: `notificationService` [CREATE H-1]
**AI Agents**: None (routing only)
**Provider Adapters**: Twilio (SMS), Gmail, M365 (email), Slack, Teams

---

## Decision OS

**Mission**: Every business decision is intelligent, documented, and auditable.

**KPIs Owned**: decisions_made, decisions_executed, approval_cycle_time, recommendation_acceptance_rate

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| KPI threshold alert | WF-014 | kpi.threshold.exceeded | Intelligence OS triggers, Decision OS creates decision |
| Approval gate management | (workflow steps) | Any high-risk workflow step | All OS modules use Decision OS approvals |
| BTE execute phase | WF-015 partial | BTE cycle | BTE orchestrates, Decision OS owns decisions |

**Services**: `businessDecisionService`, `scenarioService`
**AI Agents**: Decision OS Agent (decision synthesis, option scoring)

---

## Intelligence OS

**Mission**: Every business signal becomes actionable intelligence. Continuous improvement.

**KPIs Owned**: health_score, insights_generated, recommendations_accepted, time_to_insight

| Automation | Workflow | Trigger | Cross-OS Handoff |
|-----------|---------|---------|-----------------|
| BTE daily cycle | WF-015 | scheduler (06:00 UTC daily) | Orchestrates ALL OS modules |
| Weekly executive briefing | WF-013 | scheduler (Monday 07:00) | → Communication OS (email delivery) |
| KPI measurement | (action) | BTE cycle, manual | Feeds all other OS modules |
| AI workforce daily tasks | WF-015 phase 5 | BTE trigger | Intelligence OS dispatches, other OS execute |

**Services**: `kpiMeasurementService`, `analyticsService`, `executiveBriefingService`, `insightService`, `missionControlService`
**AI Agents**: Intelligence OS Agent, all AI employees (via AgentRuntime)

---

## Cross-OS Orchestration Map

```
intelligence.os (BTE) ─────────────────────────────────────────┐
                                                                │
    ┌─────────────────┐    ┌─────────────────┐                 │
    │   Work OS       │    │   Money OS      │                 │
    │ job.completed ──┼────┼──► invoice gen  │                 │
    │ job.completed ──┼────┼──► review req   │◄────────────────┘
    └─────────────────┘    └────────┬────────┘
                                    │ payment.received
                                    ▼
                         ┌─────────────────┐
                         │   Growth OS     │
                         │ referral trigger│
                         └─────────────────┘

communication.os ──────────────────────────────────────────────►  All OS (sends notifications)
decision.os ───────────────────────────────────────────────────►  All OS (approval gates)
```

---

## OS Module Status

| OS | Workspace Page | API Services | AI Agent | Status |
|----|---------------|-------------|----------|--------|
| Customer OS | ✅ /customers, /reviews | ✅ customerService, customerHealthService, reviewService | 🟡 defined, not fully wired | PARTIAL |
| Growth OS | ❌ no dedicated page | ❌ leadService missing | 🔴 not defined | BLOCKED |
| Money OS | ✅ /invoices, /payments | ✅ invoiceService, paymentService | 🟡 defined | PARTIAL |
| Work OS | ✅ /jobs, /appointments | ✅ jobService, appointmentService | 🟡 defined | PARTIAL |
| Communication OS | ❌ no dedicated page | ❌ notificationService missing | 🔴 not needed | BLOCKED |
| Decision OS | ✅ /decisions, /scenarios, /approvals | ✅ businessDecisionService, scenarioService | ✅ implemented | ACTIVE |
| Intelligence OS | ✅ /analytics, /intelligence | ✅ kpiMeasurementService, analyticsService, missionControlService | ✅ implemented | ACTIVE |
