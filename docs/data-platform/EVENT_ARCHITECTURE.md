# BOSS Event Architecture

> Version: 1.0.0 | ~70 canonical event types

---

## Principles

1. Every state change emits a domain event before returning to the caller.
2. Events are published to the `EventBus` which fans out to all subscribers.
3. The `DurableEventBus` wraps `InMemoryEventBus` and persists all events to `event_log`.
4. Events carry `correlation_id` and `causation_id` for distributed tracing.
5. Consumers are registered as `eventBus.subscribe(type, handler)` — non-blocking.

---

## Event Bus Architecture

```
Producer (Service)
    │
    ▼
EventBus.publish({ type, payload, occurredAt })
    │
    ├──▶ InMemoryEventBus (fans out to all subscribers synchronously)
    │         │
    │         ├──▶ Subscriber A (analytics)
    │         ├──▶ Subscriber B (audit)
    │         └──▶ Subscriber N (workflow trigger)
    │
    └──▶ DurableEventBus overlay → event_log (Postgres)
```

### EventLog Table
```sql
event_log (id, type, payload, occurred_at, org_id, correlation_id, causation_id, created_at)
```
Supports replay, audit, and point-in-time recovery.

---

## Canonical Event Catalog

### Identity & Organization

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `organization.created` | Identity system | orgId |
| `beta.invite.generated` | BetaService | orgId, inviteCode |
| `beta.invite.redeemed` | BetaService | orgId, userId |

---

### Business Intelligence

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `business.created` | BusinessService | orgId, businessId, name, industry |
| `business_created` | BusinessService (legacy alias) | orgId, businessId |
| `business.mri.started` | MriService | orgId, businessId, mriId |
| `business.mri.completed` | MriService | orgId, businessId, mriId |
| `business_mri_started` | MriService (legacy alias) | orgId, businessId |
| `business_mri_completed` | MriService (legacy alias) | orgId, businessId |
| `business_dna_generated` | DnaService | orgId, businessId |
| `business.health.calculated` | HealthService | orgId, businessId, overallScore |
| `business_health_updated` | HealthService (legacy alias) | orgId, businessId |
| `capability_updated` | CapabilityService | orgId, businessId, capabilityKey |
| `diagnostic_completed` | DiagnosticEngine | orgId, businessId, reportId |
| `business.constraint.status_updated` | ConstraintService | orgId, businessId, constraintId, status |
| `business.constraints.analyzed` | ConstraintEngine | orgId, businessId, count |
| `constraint_analysis_completed` | ConstraintEngine (alias) | orgId, businessId |
| `business.recommendations.generated` | RecommendationEngine | orgId, businessId, count |
| `recommendations_generated` | RecommendationEngine (alias) | orgId, businessId |
| `business.recommendation.approved` | RecommendationService | orgId, businessId, recommendationId |
| `recommendation_approved` | RecommendationService (alias) | orgId, businessId |
| `recommendation_dismissed` | RecommendationService | orgId, businessId, recommendationId |
| `business.rootcause.detected` | DiagnosticEngine | orgId, businessId, constraintId |
| `business.learning.recorded` | LearningService | orgId, businessId, key |

---

### Decision & Scenario

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `business.decision.generated` | DecisionEngine | orgId, businessId, decisionId |
| `decision.generated` | DecisionService (alias) | orgId, businessId, decisionId |
| `decision.evaluated` | DecisionService | orgId, businessId, decisionId |
| `decision.approved` | DecisionService | orgId, businessId, decisionId |
| `decision.rejected` | DecisionService | orgId, businessId, decisionId |
| `decision.scheduled` | DecisionService | orgId, businessId, decisionId |
| `decision.measured` | DecisionService | orgId, businessId, decisionId, actualRoi |
| `decision.archived` | DecisionService | orgId, businessId, decisionId |
| `decision.brief.generated` | DecisionService | orgId, businessId, decisionId |
| `business.outcome.verified` | OutcomeVerificationService | orgId, businessId, decisionId |
| `business.plan.created` | ExecutionPlanService | orgId, businessId, decisionId |
| `scenario.created` | ScenarioService | orgId, businessId, scenarioId |
| `scenario.forecast.generated` | ScenarioService | orgId, businessId, scenarioId |
| `scenario.compared` | ScenarioService | orgId, businessId, comparisonId |
| `workflow.generated` | WorkflowGenerationService | orgId, businessId, workflowKey |
| `workflow_generated` | WorkflowGenerationService (alias) | orgId, businessId |

---

### BTE (Business Transformation Engine)

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `bte.cycle.scheduled` | BteService | orgId, businessId |
| `bte.cycle.started` | BteService | orgId, businessId |
| `bte.cycle.completed` | BteService | orgId, businessId |
| `bte.cycle.failed` | BteService | orgId, businessId, reason |
| `bte.cycle.cancelled` | BteService | orgId, businessId |
| `business.loop.completed` | BteService | orgId, businessId |

---

### KPI & Goals

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `business.kpi.measured` | KpiMeasurementService / PlatformSdk | orgId, businessId, kpiKey, value, measuredAt |
| `kpi.threshold.exceeded` | KpiMeasurementService | orgId, businessId, kpiKey, value, threshold |
| `business.goal.created` | GoalService | orgId, businessId, goalId |
| `business.goal.status_updated` | GoalService | orgId, businessId, goalId, status |
| `business.briefing.generated` | ExecutiveBriefingService | orgId, businessId, period |

---

### Customer & Sales OS

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `customer.created` | CustomerService | orgId, businessId, customerId |
| `lead.created` | LeadService | orgId, businessId, leadId |
| `lead.qualified` | LeadService | orgId, businessId, leadId |
| `lead.assigned` | LeadService | orgId, businessId, leadId, assignedTo |
| `lead.converted` | LeadService | orgId, businessId, leadId, customerId |
| `job.created` | JobService | orgId, businessId, jobId |
| `job.completed` | JobService | orgId, businessId, jobId |
| `job.status_changed` | JobService | orgId, businessId, jobId, status |
| `appointment.created` | AppointmentService | orgId, businessId, appointmentId |
| `appointment.confirmed` | AppointmentService | orgId, businessId, appointmentId |
| `appointment.cancelled` | AppointmentService | orgId, businessId, appointmentId |
| `appointment.status_changed` | AppointmentService | orgId, businessId, appointmentId, status |
| `invoice.created` | InvoiceService | orgId, businessId, invoiceId |
| `invoice.sent` | InvoiceService | orgId, businessId, invoiceId |
| `invoice.paid` | InvoiceService | orgId, businessId, invoiceId |
| `payment.created` | PaymentService | orgId, businessId, paymentId |
| `payment.received` | PaymentService | orgId, businessId, paymentId, amountCents |
| `review.received` | ReviewService | orgId, businessId, reviewId, rating |

---

### AI Workforce

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `ai_workforce.employee.activated` | AiWorkforceService | orgId, businessId, employeeKey |
| `ai_workforce.employee.deactivated` | AiWorkforceService | orgId, businessId, employeeKey |
| `ai_employee.inference.completed` | LoopRuntimeService | orgId, businessId, employeeKey, capabilityKey, reasoning |
| `ai_employee.task.completed` | LoopRuntimeService | orgId, businessId, employeeKey, capabilityKey, toolExecutionId |
| `ai_employee.task.failed` | LoopRuntimeService | orgId, businessId, employeeKey, capabilityKey, toolExecutionId |
| `ai_employee.escalation.triggered` | LoopRuntimeService | orgId, businessId, employeeKey, capabilityKey, reason |
| `multi_agent.plan.created` | MultiAgentService | orgId, businessId |
| `multi_agent.execution.completed` | MultiAgentService | orgId, businessId |
| `multi_agent.reflection.completed` | MultiAgentService | orgId, businessId |

---

### Tool & Integration Fabric

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `tool.execution.requested` | ToolFabricService | orgId, businessId, toolKey |
| `tool.execution.started` | ToolFabricService | orgId, businessId, toolExecutionId |
| `tool.execution.succeeded` | ToolFabricService | orgId, businessId, toolExecutionId |
| `tool.execution.failed` | ToolFabricService | orgId, businessId, toolExecutionId, errorMessage |
| `tool.credentials.resolved` | ToolFabricService | orgId, businessId, toolKey |
| `tool.provider.resolved` | ToolFabricService | orgId, businessId, providerKey |
| `tool.provider.unavailable` | ToolFabricService | orgId, businessId, providerKey |
| `tool.retry.scheduled` | ToolFabricService | orgId, businessId, toolExecutionId, attempt |
| `tool.evidence.persisted` | ToolFabricService | orgId, businessId, toolExecutionId |
| `tool.circuit.opened` | ToolFabricService | orgId, businessId, providerKey |
| `tool.circuit.closed` | ToolFabricService | orgId, businessId, providerKey |
| `marketplace.pack.installed` | MarketplaceService | orgId, businessId, packKey |
| `marketplace.pack.uninstalled` | MarketplaceService | orgId, businessId, packKey |

---

### Notifications

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `notification.sent` | NotificationService | orgId, businessId, channel, recipient, deliveryId |
| `notification.failed` | NotificationService | orgId, businessId, channel, recipient, errorMessage |

---

### Scheduler

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `scheduler.job.executed` | SchedulerService | orgId, businessId, jobId, workflowKey |

---

### Audit

| Event Type | Emitter | Payload Keys |
|-----------|---------|-------------|
| `platform.audit.recorded` | PlatformSdk / LoopRuntimeService | orgId, businessId, action, actor, resourceType, resourceId, occurredAt |
| `support.feedback.submitted` | FeedbackService | orgId, businessId |

---

## Analytics Event Subscriptions

The following domain events are subscribed in `apps/api/src/index.ts` and forwarded to the `ProductAnalyticsService` as analytics events:

| Domain Event | Analytics Event |
|-------------|----------------|
| `business.created` | `analytics.business.created` |
| `business.mri.started` | `analytics.mri.started` |
| `business.mri.completed` | `analytics.mri.completed` |
| `business.health.calculated` | `analytics.health.generated` |
| `business.recommendation.approved` | `analytics.recommendation.accepted` |
| `recommendation_dismissed` | `analytics.recommendation.rejected` |
| `customer.created` | `analytics.customer.created` |
| `job.completed` | `analytics.job.completed` |
| `payment.received` | `analytics.payment.received` |
| `lead.created` | `analytics.lead.created` |
| `lead.converted` | `analytics.lead.converted` |
| `appointment.status_changed` (no_show) | `analytics.appointment.no_show` |
| `review.received` | `analytics.review.received` |

---

## Event Versioning Strategy

| Strategy | Implementation |
|---------|----------------|
| Schema evolution | Additive fields only — never remove or rename fields |
| Breaking changes | New event type with version suffix e.g. `customer.created.v2` |
| Correlation | `correlation_id` propagated from HTTP request or parent event |
| Causation | `causation_id` = ID of the event that caused this event |
| Replay | Full replay from `event_log` by type and time range |
| Dead letters | `dead_letter_queue` table for failed workflow steps |

---

## Retry Strategy

| Scenario | Strategy |
|---------|---------|
| EventBus subscriber throws | Subscriber logs error; other subscribers continue |
| DurableEventBus write fails | Event still delivered to in-memory subscribers; durability degrades gracefully |
| Workflow step fails | Loop runtime retries up to `max_retries`; then writes to `dead_letter_queue` |
| Notification delivery fails | `NotificationService` attempts fallback provider; emits `notification.failed` |
| Tool execution fails | ToolFabricService retries with exponential back-off; emits `tool.retry.scheduled` |
