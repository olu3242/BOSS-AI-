# RC2.1 — Home Services Executive Playbook

**For:** HVAC, Plumbing, Electrical, Garage Door, Appliance Repair owners

---

## Your 5 Most Important Numbers

| KPI | Target | BOSS Tracks |
|-----|--------|-------------|
| First-Time Fix Rate | > 85% | `hs_first_time_fix_rate` |
| Technician Utilization | > 75% | `hs_technician_utilization` |
| Average Ticket Value | > $350 | `hs_avg_ticket_value` |
| Maintenance Renewal Rate | > 70% | `hs_maintenance_renewal_rate` |
| Gross Margin per Job | > 50% | `hs_gross_margin_per_job` |

---

## Daily Operating Rhythm

### Morning (7am)
- Review **Jobs Today** on workspace KPI strip
- Confirm all jobs dispatched via **Dispatch Status**
- Check for emergency calls overnight

### Mid-Day (12pm)
- AI Dispatcher surfaces any scheduling conflicts
- Operations Manager flags any callback patterns from yesterday
- Review pending estimates (> 5 days old)

### End of Day (5pm)
- Review revenue today vs target
- Approve any pending decisions from Decision OS
- Check technician utilization — anyone under 60%?

---

## Decision Triggers

| When | BOSS Recommends |
|------|----------------|
| Utilization > 80% for 2 weeks | `hs_hire_technician` |
| Callback rate > 8% | `hs_reorder_inventory` |
| Estimate acceptance < 60% | `hs_follow_up_stale_estimates` |
| Emergency backlog > 2 jobs | `hs_prioritize_emergency` |
| Renewal rate < 60% | `hs_promote_maintenance_plans` |
| Margin compressed month-over-month | `hs_increase_pricing` |

---

## Maintenance Plan Strategy

Maintenance plans are the highest-leverage lever for home services revenue:

- **Target**: 30% of one-time customers convert to annual plans
- **Price point**: $149–$299/year depending on equipment type
- **Trigger**: AI Customer Success Manager offers plan after every job
- **Playbook**: `hs_maintenance_playbook` — 4-step conversion process

---

## Emergency Protocol

1. Emergency call received → AI Dispatcher routes within 15 minutes
2. Nearest available technician assigned
3. Customer notified via SMS with tech name and ETA
4. Priority slot reserved daily for same-day emergencies
5. Premium pricing applied to emergency work (1.5x standard rate)

---

## First 30 Days with BOSS

- Week 1: Complete MRI → get your health score
- Week 2: Approve your first 3 AI recommendations
- Week 3: Turn on Maintenance Plan follow-up workflow
- Week 4: Review technician utilization — is anyone below 70%?

**Health score target at Day 30: ≥ 65**
