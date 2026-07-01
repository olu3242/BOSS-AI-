# RC2.3 — Restaurant Industry Pack: Operations Playbook

**Date:** 2026-07-01

---

## The Restaurant Economics Model

Every restaurant lives or dies by one number: **Prime Cost %**.

```
Prime Cost % = (Food Cost + Labor Cost) / Total Revenue

Target: < 60%
Warning: 60–65%
Critical: > 65%
```

If prime cost is below 60%, the business has margin left to cover rent, utilities, marketing, and profit. Above 65%, the business is structurally unprofitable regardless of revenue.

---

## Performance Targets

| KPI | Target | Owner | Frequency |
|-----|--------|-------|-----------|
| Food Cost % | < 30% | Finance | Weekly |
| Labor Cost % | < 35% | Finance | Weekly |
| Prime Cost % | < 60% | Finance | Weekly |
| Average Check Size | > $45/cover | Sales | Daily |
| Table Turn Rate | > 2.5 turns/service | Operations | Daily |
| RevPASH | > $15/seat/hour | Finance | Weekly |
| Reservation Fill Rate | > 80% | Operations | Daily |
| No-Show Rate | < 5% | Operations | Weekly |
| Food Waste % | < 5% | Operations | Weekly |
| Online Review Rating | > 4.3 stars | Marketing | Monthly |

---

## Constraint → Playbook Response Map

| Constraint | Trigger | Playbook |
|------------|---------|----------|
| `rest_food_cost_high` | Food cost % > 30% | Food Cost Reduction Playbook |
| `rest_labor_cost_high` | Labor cost % > 35% | Labor Optimization Playbook |
| `rest_high_no_show_rate` | No-show rate > 5% | No-Show Reduction Playbook |
| `rest_low_review_rating` | Rating < 4.3 stars | Review & Reputation Playbook |
| `rest_low_reservation_fill` | Fill rate < 80% | Fill Reservation Gaps decision |
| `rest_high_ticket_times` | Ticket times over target | Improve Table Turns decision |
| `rest_prime_cost_high` | Prime cost % > 65% | Both food cost + labor playbooks |

---

## Weekly Operating Rhythm

| Day | Priority | Owner |
|-----|----------|-------|
| Monday | Calculate last week's prime cost % | General Manager |
| Monday | Build demand-based labor schedule for next week | General Manager |
| Tuesday | Review waste log and adjust par levels | Kitchen Manager |
| Wednesday | Follow up on slow-moving inventory before expiry | Kitchen Manager |
| Thursday | Publish next week's schedule | General Manager |
| Thursday | Check reservation fill rate for weekend services | Reservations Coordinator |
| Friday | Pre-shift: upsell goals and VIP reservations briefed | Floor Manager |
| Sunday | Post-weekend review: prime cost pace, review rating | General Manager |

---

## AI Workforce Roles

| Role | Mission | Primary KPIs |
|------|---------|-------------|
| General Manager | Own overall profitability and team performance | Prime cost %, food cost %, labor cost %, RevPASH |
| Kitchen Manager | Control food cost and run efficient BOH | Food cost %, waste %, prime cost % |
| Floor Manager | Maximize guest experience and table turns | Table turn rate, avg check size, RevPASH |
| Reservations Coordinator | Fill the dining room and minimize no-shows | Reservation fill rate, no-show rate |
| Revenue Manager | Optimize revenue across all channels | RevPASH, avg check size, fill rate |
| Guest Experience Coordinator | Build loyalty through reputation management | Online review rating |

---

## Menu Engineering Matrix

When food cost % is high, use the menu engineering matrix to identify which items to promote, reprice, or remove:

| Quadrant | Profitability | Popularity | Action |
|----------|---------------|------------|--------|
| Stars | High | High | Feature prominently; protect margin |
| Plowhorses | Low | High | Re-engineer recipe or raise price |
| Puzzles | High | Low | Promote through server training |
| Dogs | Low | Low | Remove from menu or reprice |

The AI employees use this logic when evaluating the `rest_increase_avg_check` and `rest_reduce_food_cost` decisions.
