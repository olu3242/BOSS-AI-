# BOSS Workflow Mapping

> Version: 1.0.0 | Domain events → workflow triggers → execution chains

---

## Workflow Trigger Index

| Workflow Key | Trigger | Trigger Type | Source Event |
|-------------|---------|-------------|-------------|
| `biz.mri.complete` | MRI completed | event | `business.mri.completed` |
| `biz.dna.generate` | MRI completed | event | `business.mri.completed` |
| `biz.health.calculate` | DNA generated | event | `business_dna_generated` |
| `biz.constraints.analyze` | Health calculated | event | `business.health.calculated` |
| `biz.recommendations.generate` | Constraints analyzed | event | `business.constraints.analyzed` |
| `biz.decision.generate` | Recommendations generated | event | `business.recommendations.generated` |
| `biz.bte.cycle` | Cron (daily) | cron | `0 3 * * *` (per org TZ) |
| `lead.qualify` | Lead qualify endpoint | event | `lead.qualified` |
| `lead.convert` | Lead convert endpoint | event | `lead.converted` |
| `rec.approve` | Recommendation approved | event | `business.recommendation.approved` |
| `decision.approve` | Decision approved | event | `decision.approved` |
| `invoice.overdue` | Cron check | cron | `0 9 * * *` |
| `customer.health.update` | Payment completed | event | `payment.completed` |
| `ai.workforce.activate` | AI employee activated | event | `ai_workforce.employee.activated` |
| `multi_agent.plan` | BTE cycle | event | `bte.cycle.started` |
| `notification.send` | Various events | event | Many |

---

## Business Intelligence Workflows

### `biz.mri.complete`
```
Trigger: business.mri.completed
Steps:
  1. [auto] Validate all required questions answered
  2. [auto] Emit business.mri.validated
  3. [auto] Trigger biz.dna.generate workflow
```

### `biz.dna.generate`
```
Trigger: business.mri.completed
Steps:
  1. [ai] DnaService.generate(businessId, mriResponses)
     → Claude inference: analyze MRI → generate DNA profile
  2. [auto] Persist business_dna record
  3. [auto] Emit business_dna_generated
  4. [auto] Trigger biz.health.calculate
```

### `biz.health.calculate`
```
Trigger: business_dna_generated
Steps:
  1. [ai] DiagnosticEngine.calculateHealth(businessId)
     → Scores: financial, operational, customer, team, technology, market
  2. [auto] Persist business_health + business_health_dimensions
  3. [auto] Emit business.health.calculated
  4. [auto] Trigger biz.constraints.analyze
```

---

## Constraint → Recommendation Chain

### `biz.constraints.analyze`
```
Trigger: business.health.calculated
Steps:
  1. [ai] ConstraintEngine.analyze(businessId, healthSnapshot)
     → Identify constraints from health dimensions
     → Score each: severity, confidence, impact
  2. [auto] Persist constraint_instances + constraint_scores
  3. [auto] Compute constraint_priorities (rank by overall_score)
  4. [auto] Emit business.constraints.analyzed
  5. [conditional] If critical constraint found AND confidence >= 0.8:
     → Trigger notification.send (owner + admins)
```

### `biz.recommendations.generate`
```
Trigger: business.constraints.analyzed
Steps:
  1. [ai] RecommendationEngine.generate(businessId, constraints)
     → Map constraints → recommended actions
     → Score: priority, value, implementation difficulty
  2. [auto] Persist recommendation_instances + recommendation_scores
  3. [auto] Compute recommendation_priorities
  4. [auto] Link recommendations to constraints (recommendation_constraint_links)
  5. [auto] Update/create transformation_roadmap
  6. [auto] Emit business.recommendations.generated
```

---

## Approval-Gated Workflows

### `rec.approve`
```
Trigger: business.recommendation.approved
Steps:
  1. [auto] Verify recommendation status = 'proposed'
  2. [approval_gate] Check permission_policies.approval for this recommendation
     → If 'auto': proceed
     → If 'approval_required': gate (operator needs admin/owner approval)
     → If 'executive_review': gate (needs owner)
  3. [auto] Update recommendation status → 'approved'
  4. [auto] Emit business.recommendation.approved
  5. [conditional] If workflow_key exists:
     → Dispatch linked workflow execution
     → Update recommendation status → 'in_progress'
  6. [auto] Emit workflow.generated
```

### `decision.approve`
```
Trigger: decision.approved
Steps:
  1. [auto] Validate selected_option_key in options array
  2. [approval_gate] executive_review required (owner/admin)
  3. [auto] Update decision status → 'approved'
  4. [auto] Emit decision.approved
  5. [auto] Generate execution_plan via ExecutionPlanService
  6. [conditional] If scheduled:
     → Create scheduler_job for execution
     → Emit decision.scheduled
  7. [else]:
     → Dispatch immediate execution workflow
     → Update decision status → 'executing'
```

---

## BTE (Business Transformation Engine)

### `biz.bte.cycle`
```
Trigger: cron 0 3 * * * (per business timezone)
Steps:
  1. [ai] Analyze all KPIs → identify degrading metrics
  2. [ai] Run root cause analysis (DiagnosticEngine)
  3. [ai] Generate ranked action list (RecommendationEngine)
  4. [multi-agent] Dispatch AI workforce employees by domain:
     → CEO: strategic review
     → CFO: financial health
     → COO: operations
     → CMO/Sales: pipeline
     → [industry-specific employees]
  5. [auto] For each action:
     → If safe + auto-approval: execute immediately
     → If approval_required: create pending approval request
     → If executive_review: notify owner
  6. [auto] Recalculate health score
  7. [auto] Update executive_briefings
  8. [auto] Emit bte.cycle.completed
  9. [auto] Log everything to event_log + business_timeline
```

---

## Customer & Sales Workflows

### `lead.convert`
```
Trigger: lead.converted event
Steps:
  1. [auto] Create customer record from lead data
  2. [auto] Link lead.converted_customer_id → customer.id
  3. [auto] Set lead.status → 'converted', lead.converted_at → now()
  4. [auto] Emit customer.created
  5. [conditional] If estimated_value > 0:
     → Create draft invoice or opportunity (future)
```

### `invoice.overdue`
```
Trigger: cron 0 9 * * *
Steps:
  1. [auto] Query invoices WHERE status IN ('sent','viewed') AND due_at < now()
  2. [auto] For each: update status → 'overdue'
  3. [auto] Trigger notification.send (customer + finance role)
  4. [auto] Emit invoice.overdue events
```

### `customer.health.update`
```
Trigger: payment.completed
Steps:
  1. [auto] Increment customers.total_revenue
  2. [ai] Recompute customer health_score
  3. [auto] Persist updated health_score
  4. [conditional] If health_score drops below 40:
     → Emit customer.at_risk
     → Notify Customer Success AI employee
```

---

## Notification Workflow

### `notification.send`
```
Trigger: Various events (inline task, not standalone workflow)
Steps:
  1. [auto] Resolve notification channels (email, SMS, in-app)
  2. [auto] Resolve recipient list from role/user_id
  3. [auto] For each channel: create notification_delivery record
  4. [auto] Execute via provider (email provider, Twilio, etc.)
  5. [auto] Update delivery status (pending → completed / failed)
  6. [auto] Retry failed deliveries up to 3 times
```

---

## Event → Workflow Subscription Map

```
business.mri.completed          → biz.dna.generate
business_dna_generated          → biz.health.calculate
business.health.calculated      → biz.constraints.analyze
business.constraints.analyzed   → biz.recommendations.generate
business.recommendations.generated → (available for bte.cycle)
business.recommendation.approved → rec.approve
decision.approved               → decision.approve
lead.converted                  → lead.convert
payment.completed               → customer.health.update
bte.cycle.started               → multi_agent.plan
```
