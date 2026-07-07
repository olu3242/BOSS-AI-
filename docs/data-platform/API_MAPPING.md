# BOSS API Mapping

> Version: 1.0.0 | REST endpoints mapped to entities and events

## Base URL: `/api/v1`

---

## Health & Observability

| Method | Path | Service | Response |
|--------|------|---------|---------|
| GET | `/health` | ObservabilityService | RuntimeHealth snapshot |
| GET | `/v1/observability` | ObservabilityService | Full observability snapshot |
| GET | `/v1/flags` | FeatureFlagService | All feature flags (sync) |

---

## Business Intelligence OS

| Method | Path | Service | Entity | Events Emitted |
|--------|------|---------|--------|---------------|
| POST | `/v1/businesses` | BusinessService | Business | `business.created` |
| POST | `/v1/businesses/profile` | BusinessService | BusinessProfile | — |
| GET | `/v1/businesses/:businessId/profile` | BusinessService | BusinessProfile | — |
| POST | `/v1/businesses/:businessId/mri/start` | MriService | BusinessMri | `business.mri.started` |
| POST | `/v1/businesses/:businessId/mri/:mriId/respond` | MriService | BusinessMriResponse | — |
| GET | `/v1/businesses/:businessId/mri/:mriId/responses` | MriService | BusinessMriResponse[] | — |
| POST | `/v1/businesses/:businessId/dna/generate` | DnaService | BusinessDna | `business_dna_generated` |
| GET | `/v1/businesses/:businessId/dna` | DnaService | BusinessDna | — |
| POST | `/v1/businesses/:businessId/health/generate` | HealthService | BusinessHealth | `business.health.calculated` |
| GET | `/v1/businesses/:businessId/health` | HealthService | BusinessHealth | — |
| POST | `/v1/businesses/:businessId/mri/:mriId/complete` | MriService | BusinessMri | `business.mri.completed` |
| GET | `/v1/businesses` | BusinessService | Business[] | — |

---

## Constraint Intelligence

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/constraints/analyze` | ConstraintService | ConstraintInstance[] | `business.constraints.analyzed` |
| GET | `/v1/businesses/:businessId/constraints` | ConstraintService | ConstraintInstance[] | — |
| GET | `/v1/businesses/:businessId/constraints/priorities` | ConstraintService | ConstraintPriority[] | — |
| POST | `/v1/businesses/:businessId/constraints/:constraintId/status` | ConstraintService | ConstraintInstance | `business.constraint.status_updated` |

---

## Recommendation Intelligence

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/recommendations/generate` | RecommendationService | RecommendationInstance[] | `business.recommendations.generated` |
| GET | `/v1/businesses/:businessId/recommendations` | RecommendationService | RecommendationInstance[] | — |
| GET | `/v1/businesses/:businessId/recommendations/priorities` | RecommendationService | RecommendationPriority[] | — |
| GET | `/v1/businesses/:businessId/recommendations/roadmap` | RecommendationService | TransformationRoadmap | — |
| GET | `/v1/businesses/:businessId/recommendations/:recommendationId` | RecommendationService | RecommendationInstance | — |
| POST | `/v1/businesses/:businessId/recommendations/:recommendationId/approve` | RecommendationService | RecommendationInstance | `business.recommendation.approved`, `workflow.generated` |
| POST | `/v1/businesses/:businessId/recommendations/:recommendationId/dismiss` | RecommendationService | RecommendationInstance | `recommendation_dismissed` |

---

## Decision & Scenario OS

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/decisions/generate` | DecisionService | BusinessDecision | `business.decision.generated` |
| GET | `/v1/businesses/:businessId/decisions` | DecisionService | BusinessDecision[] | — |
| GET | `/v1/businesses/:businessId/decisions/priorities` | DecisionService | Priority ranking | — |
| GET | `/v1/businesses/:businessId/decisions/optimization-report` | DecisionService | Optimization report | — |
| GET | `/v1/businesses/:businessId/decisions/:decisionId/brief` | DecisionService | Executive brief | — |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/approve` | DecisionService | BusinessDecision | `decision.approved` |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/reject` | DecisionService | BusinessDecision | `decision.rejected` |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/measure` | DecisionService | BusinessDecision | `decision.measured` |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/archive` | DecisionService | BusinessDecision | `decision.archived` |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/schedule` | DecisionService | BusinessDecision | `decision.scheduled` |

---

## Execution Plans & Outcome Verification

| Method | Path | Service | Entity |
|--------|------|---------|--------|
| GET | `/v1/businesses/:businessId/decisions/:decisionId/plan` | ExecutionPlanService | ExecutionPlan |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/plan` | ExecutionPlanService | ExecutionPlan | 
| GET | `/v1/businesses/:businessId/decisions/:decisionId/verification` | OutcomeVerificationService | Verification |
| POST | `/v1/businesses/:businessId/decisions/:decisionId/verify` | OutcomeVerificationService | Verification |

---

## Scenario Simulation

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/scenarios` | ScenarioService | BusinessScenario | `scenario.created` |
| GET | `/v1/businesses/:businessId/scenarios` | ScenarioService | BusinessScenario[] | — |
| GET | `/v1/businesses/:businessId/scenarios/forecast` | ScenarioService | Forecast | `scenario.forecast.generated` |

---

## KPI, Goals & Briefings

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| GET | `/v1/businesses/:businessId/kpis` | KpiService | KpiReading[] | — |
| GET | `/v1/businesses/:businessId/kpis/:kpiKey` | KpiService | KpiReading | — |
| GET | `/v1/businesses/:businessId/goals` | GoalService | BusinessGoal[] | — |
| GET | `/v1/businesses/:businessId/goals/:goalId` | GoalService | BusinessGoal | — |
| PATCH | `/v1/businesses/:businessId/goals/:goalId` | GoalService | BusinessGoal | `business.goal.status_updated` |
| POST | `/v1/businesses/:businessId/goals` | GoalService | BusinessGoal | `business.goal.created` |
| POST | `/v1/businesses/:businessId/goals/:goalId/complete` | GoalService | BusinessGoal | — |
| GET | `/v1/businesses/:businessId/briefings/:period` | ExecutiveBriefingService | ExecutiveBriefing | — |
| GET | `/v1/businesses/:businessId/briefings` | ExecutiveBriefingService | ExecutiveBriefing[] | — |

---

## Customer & Sales OS

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/customers` | CustomerService | Customer | `customer.created` |
| GET | `/v1/businesses/:businessId/customers` | CustomerService | Customer[] | — |
| GET | `/v1/businesses/:businessId/customers/:customerId` | CustomerService | Customer | — |
| PATCH | `/v1/businesses/:businessId/customers/:customerId` | CustomerService | Customer | — |

### Leads

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| GET | `/v1/businesses/:businessId/leads` | LeadService | Lead[] | — |
| GET | `/v1/businesses/:businessId/leads/search` | LeadService | Lead[] | — |
| POST | `/v1/businesses/:businessId/leads` | LeadService | Lead | `lead.created` |
| GET | `/v1/businesses/:businessId/leads/:leadId` | LeadService | Lead | — |
| PATCH | `/v1/businesses/:businessId/leads/:leadId` | LeadService | Lead | — |
| DELETE | `/v1/businesses/:businessId/leads/:leadId` | LeadService | — | — |
| POST | `/v1/businesses/:businessId/leads/:leadId/qualify` | LeadService | Lead | `lead.qualified` |
| POST | `/v1/businesses/:businessId/leads/:leadId/assign` | LeadService | Lead | `lead.assigned` |
| POST | `/v1/businesses/:businessId/leads/:leadId/convert` | LeadService | Lead + Customer | `lead.converted` |
| POST | `/v1/businesses/:businessId/leads/:leadId/lost` | LeadService | Lead | — |

---

## Integration & Tool OS

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/tools/request` | ToolFabricService | ToolExecution | `tool.execution.requested` |
| GET | `/v1/businesses/:businessId/tools/providers` | ToolFabricService | ProviderHealth[] | — |
| POST | `/v1/businesses/:businessId/marketplace/install` | MarketplaceService | IntegrationAccount | `marketplace.pack.installed` |
| POST | `/v1/businesses/:businessId/marketplace/uninstall` | MarketplaceService | IntegrationAccount | `marketplace.pack.uninstalled` |

---

## Workspace & Mission Control

| Method | Path | Service | Entity |
|--------|------|---------|--------|
| GET | `/v1/businesses/:businessId/workspace` | WorkspaceService | WorkspaceView |
| GET | `/v1/businesses/:businessId/workspace/approvals` | WorkspaceService | PendingApproval[] |
| GET | `/v1/businesses/:businessId/mission-control` | MissionControlService | MissionControlSnapshot |

---

## BTE & AI Workforce

| Method | Path | Service | Entity | Events |
|--------|------|---------|--------|--------|
| POST | `/v1/businesses/:businessId/bte/run` | BteService | BteCycle | `bte.cycle.started` |
| POST | `/v1/businesses/:businessId/ai-workforce/activate` | AiWorkforceService | — | `ai_workforce.employee.activated` |
| POST | `/v1/businesses/:businessId/ai-workforce/deactivate` | AiWorkforceService | — | `ai_workforce.employee.deactivated` |

---

## Common Patterns

### Authorization
All `/v1/` endpoints require a valid JWT Bearer token. `org_id` is extracted from the token, never from the request body.

### Response Format
```typescript
// Success
{ data: T, meta?: { page, perPage, total } }

// Error
{ code: string, message: string, details?: unknown, traceId: string }
```

### Pagination
```
GET /v1/businesses/:businessId/customers?page=1&perPage=50
```

### Filtering
```
GET /v1/businesses/:businessId/leads?status=new&assignedTo=user123
```
