# RC2.2 — Dental Industry Pack: Workflow Guide

**Date:** 2026-07-01

---

## Overview

The Dental Industry Pack ships 11 workflows covering the complete patient lifecycle from first contact to long-term recall. Each workflow is declarative, registered in `workflowRegistry`, and executed by the Loop Runtime with intelligence provided by MCP.

---

## Patient Journey Map

```
New Patient ──► Intake ──► Schedule ──► Confirm ──► Check-In
                                                        │
                                                   Insurance Verify
                                                        │
                                                   Treatment Plan
                                                        │
                                            Accept?──── No ──► Follow-Up ──► Accept?
                                               │
                                              Yes
                                               │
                                          Treatment
                                               │
                                           Billing ──► Payment Collection
                                               │
                                         Review Request
                                               │
                                        Recall Schedule ◄── Reactivation (12+ months)
```

---

## Workflow Definitions

### `dental_new_patient_intake`
- **Trigger:** Event (new patient registration)
- **Purpose:** Collect demographics, insurance, medical history, preferences
- **Outcome:** Patient record created, intake complete, first appointment offered
- **KPIs:** `dental_new_patient_growth`

### `dental_appointment_scheduling`
- **Trigger:** Manual
- **Purpose:** Schedule appointments by provider availability, treatment need, patient preference
- **Outcome:** Confirmed appointment on schedule
- **KPIs:** `dental_chair_utilization`
- **Constraint:** `dental_no_show_rate_high`

### `dental_confirmation_reminders`
- **Trigger:** Schedule (72h, 48h, 24h before appointment)
- **Purpose:** Reduce no-shows through automated confirmation and reminder sequences
- **Outcome:** Appointment confirmed; no-show risk reduced
- **KPIs:** `dental_no_show_rate`, `dental_cancellation_rate`
- **Constraints:** `dental_no_show_rate_high`, `dental_high_cancellation_rate`

### `dental_patient_check_in`
- **Trigger:** Event (patient arrival)
- **Purpose:** Digital check-in, form completion, room assignment
- **Outcome:** Patient ready for provider; wait time minimized
- **KPIs:** `dental_chair_utilization`

### `dental_treatment_plan_presentation`
- **Trigger:** Manual (post-diagnosis)
- **Purpose:** Present diagnosed treatment with cost estimates, financing, and phased approach
- **Outcome:** Treatment plan accepted or deferred with follow-up scheduled
- **KPIs:** `dental_case_acceptance`, `dental_provider_production`
- **Constraint:** `dental_low_case_acceptance`

### `dental_insurance_verification`
- **Trigger:** Schedule (48h before appointment)
- **Purpose:** Verify eligibility, benefits, and coverage limits
- **Outcome:** Insurance details confirmed; no surprise denials at time of service
- **KPIs:** `dental_collections_ratio`

### `dental_billing`
- **Trigger:** Event (treatment completed)
- **Purpose:** Generate claims, apply adjustments, produce patient statements
- **Outcome:** Claim submitted same-day; patient statement generated
- **KPIs:** `dental_collections_ratio`, `dental_avg_production_per_visit`
- **Constraint:** `dental_low_collections_ratio`

### `dental_payment_collection`
- **Trigger:** Event (post-treatment checkout)
- **Purpose:** Collect patient portion at checkout; follow up on outstanding balances
- **Outcome:** Patient balance collected or payment plan established
- **KPIs:** `dental_collections_ratio`, `dental_provider_production`
- **Constraint:** `dental_low_collections_ratio`

### `dental_recall_scheduling`
- **Trigger:** Schedule (weekly recall list run)
- **Purpose:** Contact patients due for hygiene recall and book their next preventive visit
- **Outcome:** Hygiene schedule filled; recall completion rate improving
- **KPIs:** `dental_recall_completion`, `dental_hygiene_reappointment`
- **Constraint:** `dental_low_recall_rate`

### `dental_review_request`
- **Trigger:** Event (appointment completed)
- **Purpose:** Request patient reviews to build online reputation
- **Outcome:** Review submitted to Google/Yelp; reputation signal improved
- **KPIs:** `dental_new_patient_growth`

### `dental_reactivation_campaign`
- **Trigger:** Schedule (monthly lapsed patient audit)
- **Purpose:** Re-engage patients with 12+ month lapse through personalized outreach
- **Outcome:** Lapsed patients reactivated and scheduled
- **KPIs:** `dental_recall_completion`, `dental_new_patient_growth`
- **Constraint:** `dental_low_recall_rate`

---

## Platform Reuse

The following General SMB workflows apply directly to dental practices without modification:

| Workflow | Application |
|----------|-------------|
| `appointment_reminder` | All appointment types |
| `review_request` | Post-treatment reputation |
| `invoice_follow_up` | Patient balance collections |
