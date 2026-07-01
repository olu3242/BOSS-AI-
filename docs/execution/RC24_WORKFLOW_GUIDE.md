# RC2.4 — Retail Industry Pack: Workflow Guide

**Date:** 2026-07-01

---

## Retail Operations Cycle

```
Vendor ──► Purchase Order ──► Receiving & Putaway ──► Floor Merchandising
                                                              │
                                                       Promotional Campaign
                                                              │
                                                      Customer Checkout ──► Loyalty Enrollment
                                                              │
                                                     Returns Processing
                                                              │
                                             ┌────────────────┴────────────────┐
                                      Markdown Mgmt                  Daily Sales Recon
                                             │
                                      Inventory Count
                                             │
                                    Vendor Performance Review
```

---

## Workflow Definitions

### `retail_purchase_order_management`
- **Trigger:** Schedule (weekly replenishment run)
- **Purpose:** Create and submit purchase orders based on reorder points and sales velocity data
- **KPIs:** `retail_inventory_turnover`, `retail_stockout_rate`
- **Constraint:** `retail_stockout_risk`

### `retail_receiving_and_putaway`
- **Trigger:** Event (delivery arrives)
- **Purpose:** Verify delivery against PO, flag short-ships, receive into system, stock to floor or backroom
- **KPIs:** `retail_sell_through_rate`, `retail_shrinkage_rate`

### `retail_inventory_count`
- **Trigger:** Schedule (cycle count rotation + annual physical)
- **Purpose:** Reconcile on-hand quantities to system records; detect shrinkage
- **KPIs:** `retail_shrinkage_rate`, `retail_inventory_turnover`
- **Constraint:** `retail_high_shrinkage`

### `retail_floor_merchandising`
- **Trigger:** Manual (new product, planogram reset, seasonal change)
- **Purpose:** Set up and maintain displays, endcaps, and promotional zones
- **KPIs:** `retail_conversion_rate`, `retail_sales_per_sqft`
- **Constraint:** `retail_low_conversion`

### `retail_customer_checkout`
- **Trigger:** Event (customer ready to purchase)
- **Purpose:** Process transaction with upsell prompts, loyalty capture, and accurate tender handling
- **KPIs:** `retail_avg_transaction_value`, `retail_units_per_transaction`

### `retail_returns_processing`
- **Trigger:** Event (customer return request)
- **Purpose:** Process returns per policy; restock sellable items; disposition damaged units
- **KPIs:** `retail_gross_margin_pct`
- **Constraint:** `retail_high_return_rate`

### `retail_markdown_management`
- **Trigger:** Schedule (weekly aging inventory review)
- **Purpose:** Execute markdown cadence on slow-moving and seasonal inventory
- **KPIs:** `retail_sell_through_rate`, `retail_inventory_turnover`
- **Constraint:** `retail_slow_moving_inventory`

### `retail_loyalty_enrollment`
- **Trigger:** Event (new customer checkout)
- **Purpose:** Enroll customer in loyalty program; capture email/SMS opt-in
- **KPIs:** `retail_customer_return_rate`

### `retail_promotional_campaign`
- **Trigger:** Manual (planned promotional events)
- **Purpose:** Execute in-store and digital promotional campaigns with pricing, signage, and email execution
- **KPIs:** `retail_conversion_rate`, `retail_avg_transaction_value`
- **Constraint:** `retail_low_conversion`

### `retail_daily_sales_reconciliation`
- **Trigger:** Schedule (close of business daily)
- **Purpose:** Reconcile register totals, cash, and card; generate daily sales summary
- **KPIs:** `retail_gross_margin_pct`, `retail_avg_transaction_value`

### `retail_vendor_performance_review`
- **Trigger:** Schedule (quarterly)
- **Purpose:** Score vendors on fill rate, lead time, quality, and pricing; renegotiate or replace underperformers
- **KPIs:** `retail_inventory_turnover`, `retail_stockout_rate`, `retail_gross_margin_pct`
- **Constraint:** `retail_stockout_risk`
