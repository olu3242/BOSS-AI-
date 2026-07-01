# RC2.1 — Home Services Workflow Guide

---

## Lead-to-Cash Workflow Chain

```
Customer Request
  → [hs_lead_intake] Lead captured, job record created
  → [hs_estimate_creation] Estimate drafted by AI Revenue Manager
  → [hs_quote_approval] Estimate sent to customer, approval tracked
  → [hs_job_scheduling] Job time slot booked, customer confirmed
  → [hs_technician_dispatch] Technician assigned, route optimized, SMS sent
  → [hs_job_execution] Technician completes job, parts logged
  → [hs_quality_verification] Post-job quality check
  → [hs_invoice_generation] Invoice auto-generated and sent
  → [hs_payment_confirmation] Payment collected, job closed
  → [review_request] Customer review requested (platform workflow)
  → [hs_maintenance_follow_up] Maintenance plan offered
```

## Emergency Path

```
Emergency Call
  → [hs_emergency_dispatch] Priority routing, same-day guarantee
  → [hs_job_execution] Immediate response
  → [hs_payment_confirmation] Payment on-site
```

## Workflow Trigger Types

| Workflow | Trigger | Condition |
|----------|---------|-----------|
| `hs_lead_intake` | event | `service_request.received` |
| `hs_estimate_creation` | manual | Technician assessment complete |
| `hs_quote_approval` | event | `estimate.sent` |
| `hs_job_scheduling` | event | `quote.approved` |
| `hs_technician_dispatch` | event | `job.scheduled` |
| `hs_emergency_dispatch` | event | `emergency_request.received` |
| `hs_job_execution` | manual | Technician on-site |
| `hs_quality_verification` | event | `job.completed` |
| `hs_invoice_generation` | event | `job.completed` |
| `hs_payment_confirmation` | event | `invoice.sent` |
| `hs_maintenance_follow_up` | event | `payment.confirmed` |

## KPI Impact Per Workflow

| Workflow | Primary KPI | Secondary KPI |
|----------|-------------|---------------|
| `hs_technician_dispatch` | `hs_technician_utilization` | `hs_avg_response_time` |
| `hs_job_execution` | `hs_first_time_fix_rate` | `hs_gross_margin_per_job` |
| `hs_estimate_creation` | `hs_estimate_acceptance_rate` | `hs_avg_ticket_value` |
| `hs_maintenance_follow_up` | `hs_maintenance_renewal_rate` | `hs_revenue_per_technician` |
| `hs_quality_verification` | `hs_callback_rate` | `hs_customer_satisfaction` |
