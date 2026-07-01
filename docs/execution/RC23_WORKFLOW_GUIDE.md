# RC2.3 — Restaurant Industry Pack: Workflow Guide

**Date:** 2026-07-01

---

## Service Cycle Map

```
Reservation ──► Confirmation Reminder ──► Service Day
                                              │
                                    Staff Scheduling (pre)
                                    Inventory Receiving (pre)
                                              │
                                       Table Management
                                              │
                                         Order Taking
                                              │
                                   Kitchen Ticket Management
                                              │
                                   End-of-Day Reconciliation
                                              │
                               ┌──────────────┴──────────────┐
                          Waste Tracking              Review Response
                               │
                       Weekly Prime Cost Review
```

---

## Workflow Definitions

### `rest_reservation_management`
- **Trigger:** Event (new booking request)
- **Purpose:** Accept, assign, and confirm reservations across phone, web (own site), and OTA platforms
- **Outcome:** Confirmed reservation with accurate cover count and special request notes
- **KPIs:** `rest_reservation_fill_rate`, `rest_no_show_rate`
- **Constraint:** `rest_low_reservation_fill`

### `rest_reservation_confirmation`
- **Trigger:** Schedule (24h before reservation time)
- **Purpose:** Automated confirmation message; collect credit card hold for qualifying reservations
- **Outcome:** Reservation confirmed or released; no-show rate reduced
- **KPIs:** `rest_no_show_rate`
- **Constraint:** `rest_high_no_show_rate`

### `rest_table_management`
- **Trigger:** Event (guest arrival)
- **Purpose:** Assign parties to tables optimizing for turn rate, covers, and reservation flow
- **Outcome:** Every guest seated promptly; dining room at maximum covers per service
- **KPIs:** `rest_table_turn_rate`, `rest_revpash`

### `rest_order_taking`
- **Trigger:** Event (table seated)
- **Purpose:** Capture guest orders accurately with upsell prompts and POS transmission to kitchen
- **Outcome:** Accurate ticket in kitchen; upsell opportunity captured
- **KPIs:** `rest_avg_check_size`

### `rest_kitchen_ticket_management`
- **Trigger:** Event (ticket received from POS)
- **Purpose:** Route and prioritize tickets to minimize cook times and ensure consistent food quality
- **Outcome:** Tickets fired and delivered within target times; table turn momentum maintained
- **KPIs:** `rest_table_turn_rate`
- **Constraint:** `rest_high_ticket_times`

### `rest_inventory_receiving`
- **Trigger:** Event (delivery arrives)
- **Purpose:** Verify delivery against purchase order, log quantities, update inventory system
- **Outcome:** Accurate inventory count; over-delivery and substitutions flagged
- **KPIs:** `rest_food_cost_pct`, `rest_waste_pct`
- **Constraint:** `rest_food_cost_high`

### `rest_waste_tracking`
- **Trigger:** Schedule (end of each service)
- **Purpose:** Log food waste by category to identify patterns and adjust prep volumes
- **Outcome:** Daily waste record maintained; over-prep patterns surfaced weekly
- **KPIs:** `rest_waste_pct`, `rest_food_cost_pct`
- **Constraint:** `rest_food_cost_high`

### `rest_end_of_day_reconciliation`
- **Trigger:** Schedule (close of service)
- **Purpose:** Reconcile POS totals, cash, tips, comps, and voids
- **Outcome:** Clean financial record for the day; discrepancies identified same-day
- **KPIs:** `rest_prime_cost_pct`, `rest_avg_check_size`

### `rest_weekly_prime_cost_review`
- **Trigger:** Schedule (every Monday)
- **Purpose:** Calculate and review food cost %, labor cost %, and prime cost % vs. targets
- **Outcome:** Variance identified early; corrective action initiated before it compounds
- **KPIs:** `rest_prime_cost_pct`, `rest_food_cost_pct`, `rest_labor_cost_pct`
- **Constraints:** `rest_food_cost_high`, `rest_labor_cost_high`

### `rest_review_response`
- **Trigger:** Schedule (daily review monitoring)
- **Purpose:** Monitor and respond to new reviews on Google, Yelp, TripAdvisor within 24h
- **Outcome:** All reviews acknowledged; guest recovery initiated for negative reviews
- **KPIs:** `rest_online_review_rating`
- **Constraint:** `rest_low_review_rating`

### `rest_staff_scheduling`
- **Trigger:** Schedule (weekly, Thursday for following week)
- **Purpose:** Build labor schedules aligned to forecasted covers to control labor cost %
- **Outcome:** Published schedule aligned to demand; overtime minimized
- **KPIs:** `rest_labor_cost_pct`, `rest_prime_cost_pct`
- **Constraint:** `rest_labor_cost_high`
