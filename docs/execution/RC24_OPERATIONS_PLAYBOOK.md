# RC2.4 — Retail Industry Pack: Operations Playbook

**Date:** 2026-07-01

---

## The Retail Performance Model

Retail profitability flows from three interdependent levers:

```
Gross Margin %    ×    Inventory Turnover    =    Return on Investment
   (45%+)               (4x+ per year)              (Maximize this)
```

A high gross margin with low turnover means capital is trapped in slow-moving stock. High turnover with low margins means working hard for little reward. The goal is to optimize both simultaneously.

---

## Performance Targets

| KPI | Target | Owner | Frequency |
|-----|--------|-------|-----------|
| Gross Margin % | > 45% | Finance | Monthly |
| Inventory Turnover | > 4x/year | Operations | Monthly |
| Sell-Through Rate | > 80% | Operations | Monthly |
| Avg Transaction Value | > $65 | Sales | Weekly |
| Units Per Transaction | > 2.5 | Sales | Weekly |
| Store Conversion Rate | > 25% | Sales | Weekly |
| Sales Per Square Foot | > $300/sqft/year | Finance | Monthly |
| Shrinkage Rate | < 1.5% | Operations | Monthly |
| Customer Return Rate | > 30% | Marketing | Monthly |
| Stockout Rate | < 2% | Operations | Weekly |

---

## Constraint → Playbook Response Map

| Constraint | Trigger | Playbook |
|------------|---------|----------|
| `retail_slow_moving_inventory` | Sell-through < 50% at 60 days | Inventory Clearance Playbook |
| `retail_high_shrinkage` | Shrinkage > 1.5% | Shrinkage Reduction Playbook |
| `retail_low_conversion` | Conversion rate < 25% | Conversion Rate Playbook |
| `retail_low_inventory_turns` | Turns < 4x/year | Clear Slow-Moving Inventory decision |
| `retail_margin_compression` | Gross margin < 45% | Improve Gross Margin decision |
| `retail_stockout_risk` | Stockout rate > 2% | Optimize Inventory Levels decision |

---

## Markdown Cadence

When slow-moving inventory is detected, apply this structured markdown schedule:

| Age | Sell-Through | Action |
|-----|--------------|--------|
| 30–60 days | < 50% | Monitor; no action yet |
| 60–75 days | < 50% | First markdown: 20% off |
| 75–90 days | < 30% after markdown | Second markdown: 40% off |
| 90+ days | < 15% after markdown | Liquidate, donate, or destroy |

Preventing deep markdowns is always cheaper than executing them. The key is buying discipline: order less more often.

---

## AI Workforce Roles

| Role | Mission | Primary KPIs |
|------|---------|-------------|
| Store Manager | Own commercial performance | Gross margin, sales/sqft, conversion |
| Inventory Manager | Optimal stock levels | Inventory turnover, sell-through, stockout |
| Sales Floor Lead | Convert traffic to revenue | Conversion rate, avg transaction, UPT |
| Loss Prevention Coordinator | Protect profitability | Shrinkage rate, gross margin |
| Customer Experience Manager | Build loyal repeat customers | Customer return rate, avg transaction |
| Merchandising Coordinator | Right product, right place | Sales/sqft, sell-through, conversion |

---

## Weekly Operating Rhythm

| Day | Priority | Owner |
|-----|----------|-------|
| Monday | Review prior week's sales vs. budget and plan corrective action | Store Manager |
| Monday | Pull aging inventory report; flag SKUs for markdown review | Inventory Manager |
| Tuesday | Cycle count rotating category | Loss Prevention Coordinator |
| Wednesday | Review open purchase orders; confirm upcoming deliveries | Inventory Manager |
| Thursday | Update promotional displays for weekend; brief sales team | Merchandising Coordinator |
| Friday | Review conversion rate for the week; adjust floor greeting approach | Sales Floor Lead |
| Saturday | Peak service: monitor conversion rate hourly; real-time coaching | Sales Floor Lead |
| Sunday | Week-end close: record loyalty enrollment rate and daily UPT | Customer Experience Manager |
