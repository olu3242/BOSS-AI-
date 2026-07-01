# RC2.2 — Dental Industry Pack: Practice Playbook

**Date:** 2026-07-01

---

## Overview

This document is the operational guide for BOSS-powered dental practices. It defines the key performance targets, the KPIs that measure them, the constraints that signal problems, and the AI-driven playbooks that resolve them.

---

## Practice Performance Targets

| KPI | Target | Owner | Frequency |
|-----|--------|-------|-----------|
| Chair Utilization | > 80% | Operations | Weekly |
| Provider Production | > $50,000/month | Finance | Monthly |
| Collections Ratio | > 95% | Finance | Monthly |
| Case Acceptance | > 65% | Sales | Monthly |
| Recall Completion | > 75% | Operations | Monthly |
| Hygiene Reappointment | > 85% | Operations | Weekly |
| No-Show Rate | < 8% | Operations | Weekly |
| Cancellation Rate | < 5% | Operations | Weekly |
| Avg Production/Visit | > $350 | Finance | Monthly |
| New Patient Growth | > 20/month | Marketing | Monthly |

---

## Constraint → Playbook Response Map

| Constraint | Trigger Condition | Playbook |
|------------|-------------------|----------|
| `dental_no_show_rate_high` | No-show rate > 8% | No-Show Reduction Playbook |
| `dental_low_case_acceptance` | Case acceptance < 65% | Case Acceptance Playbook |
| `dental_low_recall_rate` | Recall completion < 75% | Recall & Reappointment Playbook |
| `dental_low_collections_ratio` | Collections ratio < 95% | Collections Optimization Playbook |
| `dental_chair_underutilized` | Chair utilization < 80% | Fill Open Schedule Gaps decision |
| `dental_high_cancellation_rate` | Cancellation rate > 5% | No-Show Reduction Playbook |

---

## Playbook Summaries

### Recall & Reappointment Playbook

**When:** Recall completion < 75%  
**Owner:** `dental_recall_coordinator`  
**Steps:** Pull overdue list → Send first contact → Phone follow-up for non-responders → Escalate 12-month lapsed → Weekly rate review  
**Target:** Recall rate ≥ 75% within 60 days  
**Estimated time:** 9 hours total

---

### Case Acceptance Playbook

**When:** Case acceptance < 65%  
**Owner:** `dental_treatment_coordinator`  
**Steps:** Pre-consult plan review → Visual treatment presentation → Financing options offered → 48-hour follow-up for undecided patients  
**Target:** Case acceptance ≥ 65% within 30 days  
**Estimated time:** 2.5 hours per cycle

---

### No-Show Reduction Playbook

**When:** No-show rate > 8%  
**Owner:** `dental_practice_manager`  
**Steps:** 90-day pattern audit → Activate 3-touch confirmation → Implement deposit policy → Build same-day fill list  
**Target:** No-show rate ≤ 8% within 30 days  
**Estimated time:** 6 hours total

---

### Collections Optimization Playbook

**When:** Collections ratio < 95%  
**Owner:** `dental_revenue_coordinator`  
**Steps:** Claims denial audit → Pre-appointment insurance verification → Same-day claim submission → 30-day balance follow-up  
**Target:** Collections ratio ≥ 95% within 60 days  
**Estimated time:** 8 hours total

---

## AI Workforce Roles

| Role | Mission | Primary KPIs |
|------|---------|-------------|
| Practice Manager | Daily operations oversight | Chair utilization, production, no-show |
| Treatment Coordinator | Case acceptance maximization | Case acceptance, provider production |
| Front Desk Coordinator | Seamless patient experience | No-show rate, cancellation, collections |
| Recall Coordinator | Hygiene schedule full | Recall completion, reappointment |
| Revenue Coordinator | Financial performance | Collections ratio, avg production/visit |
| Patient Success Coordinator | Long-term patient loyalty | New patient growth, recall completion |

---

## Weekly Operating Rhythm

| Day | Priority | Owner |
|-----|----------|-------|
| Monday | Review prior week no-show and cancellation rates | Practice Manager |
| Monday | Pull new recall list and begin outreach | Recall Coordinator |
| Tuesday | Submit outstanding claims from prior week | Revenue Coordinator |
| Wednesday | Review open treatment plans for follow-up | Treatment Coordinator |
| Thursday | Check insurance verifications for next week | Front Desk Coordinator |
| Friday | Review week's chair utilization; fill gaps | Practice Manager |
| Friday | Post-visit review requests sent | Patient Success Coordinator |
