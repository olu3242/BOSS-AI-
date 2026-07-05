# EVENT CATALOG
> Generated: 2026-07-05 | Canonical domain events for the BOSS platform

Convention: `{context}.{entity}.{verb}` — all lowercase, dot-separated

---

## Platform Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `organization.created` | organization | identity service | BTE enrollment, onboarding | high |
| `organization.switched` | organization | web BFF | dashboard, context services | high |
| `user.invited` | organization | identity service | notification (welcome email) | medium |
| `user.activated` | organization | identity service | onboarding workflow | medium |

---

## Business Context Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `business.created` | business | businessProfileService | BTE enrollment, context publish | high |
| `business.updated` | business | businessProfileService | context versioning | medium |
| `business.context.published` | business | businessContextService | MCP engines, graph service | high |
| `business.discovery.created` | business | businessContextService | graph service | medium |
| `business.discovery.updated` | business | businessContextService | semantic layer | medium |
| `business.discovery.validated` | business | businessContextService | context publish | medium |
| `business.graph.created` | business | businessGraphService | semantic layer | medium |
| `business.graph.versioned` | business | businessGraphService | query service | medium |
| `business.semantic.loaded` | business | businessSemanticLayer | query service | low |
| `business.health.updated` | business | businessHealthService | dashboard, BTE | medium |
| `business.timeline.updated` | business | businessTimelineService | timeline page | low |

---

## Intelligence Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `audit.started` | audit | businessMriService | timeline | medium |
| `audit.completed` | audit | businessMriService | health service, BTE | high |
| `constraint.detected` | constraint | businessConstraintService | BTE, recommendation engine | medium |
| `constraint.resolved` | constraint | businessConstraintService | BTE, health service | medium |
| `recommendation.generated` | recommendation | businessRecommendationService | workflow generator, dashboard | medium |
| `recommendation.accepted` | recommendation | approvals page | workflowGenerationService | high |
| `recommendation.dismissed` | recommendation | web BFF | recommendation service | low |
| `decision.created` | decision | businessDecisionService | BTE, dashboard | medium |
| `decision.executed` | decision | businessDecisionService | BTE verify phase | high |
| `kpi.updated` | kpi | kpiMeasurementService | dashboard, BTE | medium |
| `kpi.threshold.exceeded` | kpi | kpiMeasurementService [ADD] | alert workflow, BTE | high |
| `business.insight.generated` | business | insightService | intelligence workspace | low |
| `briefing.generated` | business | executiveBriefingService | notification (email) | low |

---

## BTE / Operating Loop Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `bte.cycle.started` | bte | bteService | telemetry | low |
| `bte.cycle.completed` | bte | bteService | health update, telemetry | medium |
| `bte.cycle.failed` | bte | bteService | alert, telemetry | high |
| `bte.phase.completed` | bte | businessOperatingLoopService | telemetry | low |

---

## Workflow & Agent Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `workflow.installed` | workflow | workflowGenerationService | workspace UI | low |
| `workflow.started` | workflow | WorkflowRuntime | telemetry, audit | medium |
| `workflow.step.completed` | workflow | createLoopRuntime | telemetry | low |
| `workflow.step.failed` | workflow | createLoopRuntime | dead letter, telemetry | high |
| `workflow.completed` | workflow | WorkflowRuntime | BTE verify, outcome verification | high |
| `workflow.failed` | workflow | WorkflowRuntime | alert, dead letter | high |
| `workflow.compensated` | workflow | WorkflowRuntime | audit | high |
| `agent.created` | agent | agentRuntime | AI workforce service | low |
| `agent.started` | agent | agentRuntime | telemetry | low |
| `agent.completed` | agent | agentRuntime | memory update, KPI update | medium |
| `agent.failed` | agent | agentRuntime | alert, escalation | high |
| `parallel.group.started` | workflow | createLoopRuntime | telemetry | low |
| `parallel.group.completed` | workflow | createLoopRuntime | telemetry | low |

---

## Customer OS Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `customer.created` | customer | customerService [ADD] | onboarding workflow, CRM sync | medium |
| `customer.updated` | customer | customerService [ADD] | CRM sync | low |
| `customer.inactive.detected` | customer | customerHealthService [ADD] | re-engagement workflow | medium |
| `customer.reengaged` | customer | customerService [ADD] | CRM update, KPI update | medium |
| `customer.health.degraded` | customer | customerHealthService [ADD] | churn alert workflow | high |
| `customer.churned` | customer | customerService [ADD] | BTE, analytics | high |
| `review.received` | customer | reviewService [ADD] | reputation workflow, KPI update | medium |
| `review.responded` | customer | reviewService [ADD] | telemetry | low |

---

## Work OS Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `job.created` | job | jobService [ADD] | dispatch workflow, scheduling | medium |
| `job.approved` | job | jobService [ADD] | dispatch workflow | medium |
| `job.scheduled` | job | jobService [ADD] | reminder workflow | medium |
| `job.started` | job | jobService [ADD] | telemetry, tech notification | low |
| `job.completed` | job | jobService [ADD] | invoice workflow, review request, KPI update | high |
| `job.cancelled` | job | jobService [ADD] | customer notification, KPI update | high |
| `appointment.created` | appointment | appointmentService [ADD] | reminder workflow | medium |
| `appointment.confirmed` | appointment | appointmentService [ADD] | dispatch workflow | medium |
| `appointment.cancelled` | appointment | appointmentService [ADD] | customer notification, reschedule | high |
| `appointment.no_show` | appointment | appointmentService [ADD] | re-engagement workflow, KPI update | high |
| `technician.assigned` | job | jobService [ADD] | tech notification, dispatch | medium |

---

## Money OS Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `estimate.created` | invoice | invoiceService [ADD] | customer notification | low |
| `estimate.accepted` | invoice | invoiceService [ADD] | job creation workflow | high |
| `estimate.declined` | invoice | invoiceService [ADD] | follow-up workflow | medium |
| `invoice.created` | invoice | invoiceService [ADD] | customer notification | medium |
| `invoice.sent` | invoice | invoiceService [ADD] | payment tracking | medium |
| `invoice.paid` | invoice | invoiceService [ADD] | referral workflow, revenue KPI update | high |
| `invoice.overdue.detected` | invoice | invoiceService [ADD] | follow-up workflow | high |
| `invoice.written_off` | invoice | invoiceService [ADD] | analytics, bad debt KPI | high |
| `payment.received` | payment | paymentService [ADD] | invoice update, KPI update | high |
| `payment.failed` | payment | paymentService [ADD] | retry workflow, customer alert | high |
| `payment.refunded` | payment | paymentService [ADD] | KPI update, accounting sync | high |

---

## Growth OS Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `lead.created` | lead | leadService [CREATE] | qualification workflow | high |
| `lead.qualified` | lead | leadService [CREATE] | assignment workflow | high |
| `lead.assigned` | lead | leadService [CREATE] | rep notification | medium |
| `lead.contacted` | lead | leadService [CREATE] | CRM sync | low |
| `lead.converted` | lead | leadService [CREATE] | customer created event | high |
| `lead.lost` | lead | leadService [CREATE] | lost deal analysis | medium |
| `referral.created` | referral | referralService [CREATE] | reward workflow | medium |
| `referral.converted` | referral | referralService [CREATE] | reward fulfilment, KPI update | high |

---

## Communication OS Events

| Event Key | Category | Publisher | Subscribers | Risk |
|-----------|----------|-----------|-------------|------|
| `communication.missed_call.detected` | communication | telephony webhook [CREATE] | missed call workflow | high |
| `notification.sent` | notification | notificationService [CREATE] | audit log, delivery tracking | medium |
| `notification.delivered` | notification | notificationService [CREATE] | telemetry | low |
| `notification.failed` | notification | notificationService [CREATE] | retry, alert | high |
| `conversation.started` | communication | future (messaging) | Communication OS | medium |
| `document.uploaded` | communication | future (storage) | document workflow | medium |

---

## Events to ADD (current gaps — [ADD] markers above)

Priority by automation impact:
1. `job.completed` — unblocks AUTO-003, AUTO-005
2. `payment.received` — unblocks AUTO-007
3. `invoice.paid` — unblocks AUTO-016
4. `customer.created` — unblocks AUTO-013
5. `kpi.threshold.exceeded` — unblocks AUTO-018
6. `appointment.created` — unblocks AUTO-002
7. `review.received` — unblocks AUTO-003 variant
8. `customer.inactive.detected` — unblocks AUTO-004
9. `customer.health.degraded` — unblocks AUTO-014

---

## Events to CREATE (new entities — [CREATE] markers above)

1. All `lead.*` events — requires `leadService` + migration
2. `communication.missed_call.detected` — requires telephony webhook
3. All `notification.*` events — requires `notificationService`
4. All `referral.*` events — requires `referralService`
