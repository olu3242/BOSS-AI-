import { createInMemoryContainer, createPostgresContainer, type RepositoryContainer } from "./container.js";
import { createBusinessProfileService } from "./services/businessProfileService.js";
import { createBusinessMriService } from "./services/businessMriService.js";
import { createBusinessDnaService } from "./services/businessDnaService.js";
import { createBusinessHealthService } from "./services/businessHealthService.js";
import { createBusinessCapabilityService } from "./services/businessCapabilityService.js";
import { createBusinessTimelineService } from "./services/businessTimelineService.js";
import { createBusinessConstraintService } from "./services/businessConstraintService.js";
import { createBusinessRecommendationService } from "./services/businessRecommendationService.js";
import { createToolFabricService } from "./services/toolFabricService.js";
import { createLoopRuntimeService } from "./services/loopRuntimeService.js";
import { createWorkflowGenerationService } from "./services/workflowGenerationService.js";
import { createMissionControlService } from "./services/missionControlService.js";
import { createBusinessDiagnosticService } from "./services/businessDiagnosticService.js";
import {
  createBusinessContextService,
  type BusinessContextService,
} from "./services/businessContextService.js";
import {
  createBusinessGraphService,
  type BusinessGraphService,
} from "./services/businessGraphService.js";
import {
  createGraphRuntime,
  type GraphRuntime,
} from "./services/businessGraphRuntime.js";
import {
  ContextResolutionService,
  createBusinessSemanticLayer,
  DependencyResolutionService,
  type BusinessSemanticLayer,
} from "./services/businessSemanticLayer.js";
import {
  createBusinessQueryService,
  type BusinessQueryService,
} from "./services/businessQueryService.js";
import { createBusinessController } from "./controllers/businessController.js";
import { createBusinessMriController } from "./controllers/businessMriController.js";
import { createBusinessDnaController } from "./controllers/businessDnaController.js";
import { createBusinessHealthController } from "./controllers/businessHealthController.js";
import { createBusinessCapabilityController } from "./controllers/businessCapabilityController.js";
import { createBusinessTimelineController } from "./controllers/businessTimelineController.js";
import { createBusinessConstraintController } from "./controllers/businessConstraintController.js";
import { createBusinessRecommendationController } from "./controllers/businessRecommendationController.js";
import { createToolFabricController } from "./controllers/toolFabricController.js";
import { createMissionControlController } from "./controllers/missionControlController.js";
import { createBusinessDiagnosticController } from "./controllers/businessDiagnosticController.js";
import { createObservabilityService } from "./services/observabilityService.js";
import { createMultiAgentRuntimeService } from "./services/multiAgentRuntimeService.js";
import { createBusinessDecisionService } from "./services/businessDecisionService.js";
import { createScenarioService } from "./services/scenarioService.js";
import { createKpiMeasurementService } from "./services/kpiMeasurementService.js";
import { createBusinessGoalService } from "./services/businessGoalService.js";
import { createExecutiveBriefingService } from "./services/executiveBriefingService.js";
import { createRootCauseService } from "./services/rootCauseService.js";
import { createExecutionPlanService } from "./services/executionPlanService.js";
import { createOutcomeVerificationService } from "./services/outcomeVerificationService.js";
import { createBusinessOperatingLoopService } from "./services/businessOperatingLoopService.js";
import { createWorkspaceService } from "./services/workspaceService.js";
import { createFeatureFlagService } from "./services/featureFlagService.js";
import { createSupportService } from "./services/supportService.js";
import { createProductAnalyticsService } from "./services/productAnalyticsService.js";
import { createCustomerHealthService } from "./services/customerHealthService.js";
import { createBetaInviteService } from "./services/betaInviteService.js";
import { createMarketplaceService } from "./services/marketplaceService.js";
import { createSchedulerService } from "./services/schedulerService.js";
import { createBteService } from "./services/bteService.js";
import { createAiWorkforceService } from "./services/aiWorkforceService.js";
import { createOrgHealthService } from "./services/orgHealthService.js";
import { createInsightService } from "./services/insightService.js";
import { createCustomerService } from "./services/customerService.js";
import { createCustomerController } from "./controllers/customerController.js";

import { InMemoryEventBus } from "@boss/events";
import { InMemoryAuditSink, PostgresAuditSink } from "./observability.js";
import { JournaledEventBus, PostgresEventJournal } from "./runtimePersistence.js";

export function createApiFromContainer(
  repos: RepositoryContainer,
  businessContext: BusinessContextService = createBusinessContextService(repos),
  businessGraph: BusinessGraphService = createBusinessGraphService(
    repos,
    businessContext,
  ),
  graphRuntime: GraphRuntime = createGraphRuntime(businessGraph),
  businessSemantic: BusinessSemanticLayer = createBusinessSemanticLayer(
    graphRuntime,
    businessContext,
  ),
  businessQueries: BusinessQueryService = createBusinessQueryService(
    businessSemantic,
  ),
) {
  const toolFabric = createToolFabricService(repos);
  const loopRuntime = createLoopRuntimeService(repos, toolFabric);
  const workflowGeneration = createWorkflowGenerationService(repos, loopRuntime);
  const observability = createObservabilityService();
  observability.attachToEventBus(repos);
  const multiAgentRuntime = createMultiAgentRuntimeService(repos, loopRuntime);
  const businessDecision = createBusinessDecisionService(repos);
  const scenario = createScenarioService(repos);

  repos.eventBus.subscribe<{ orgId: string; businessId: string; recommendationId: string }>(
    "business.recommendation.approved",
    (event) => {
      void workflowGeneration.generateAndExecute(
        event.payload.orgId,
        event.payload.businessId,
        event.payload.recommendationId,
      );
    },
  );

  const kpiMeasurement = createKpiMeasurementService(repos);
  const businessGoal = createBusinessGoalService(repos);
  const executiveBriefing = createExecutiveBriefingService(repos);
  const rootCause = createRootCauseService(repos);
  const executionPlan = createExecutionPlanService(repos);
  const outcomeVerification = createOutcomeVerificationService(repos);
  const businessOperatingLoop = createBusinessOperatingLoopService(repos);
  const workspace = createWorkspaceService(repos);
  const featureFlags = createFeatureFlagService();
  const support = createSupportService(repos);
  const productAnalytics = createProductAnalyticsService(repos);
  const customerHealth = createCustomerHealthService(repos);
  const betaInvite = createBetaInviteService(repos);
  const marketplace = createMarketplaceService(repos);
  const workflowStepRegistry = new Map();
  const scheduler = createSchedulerService(repos, loopRuntime, workflowStepRegistry);
  const bte = createBteService(repos, businessOperatingLoop, scheduler);
  const aiWorkforce = createAiWorkforceService(repos);
  const orgHealth = createOrgHealthService(repos, bte, aiWorkforce);
  const insight = createInsightService(repos);

  repos.eventBus.subscribe<{ orgId: string; businessId: string; industry?: string; employeeCount?: number }>(
    "business.created",
    (e) => {
      void bte.scheduleDailyCycle(e.payload.orgId, e.payload.businessId);
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; industry?: string; employeeCount?: number }>(
    "business.created",
    (e) => {
      void productAnalytics.track({
        type: "analytics.business.created",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { industry: e.payload.industry ?? null, employeeCount: e.payload.employeeCount ?? null },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; mriId: string }>(
    "mri.completed",
    (e) => {
      void productAnalytics.track({
        type: "analytics.mri.completed",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { mriId: e.payload.mriId },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; decisionId: string; decisionType?: string; confidenceScore?: number }>(
    "decision.approved",
    (e) => {
      void productAnalytics.track({
        type: "analytics.recommendation.accepted",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { decisionId: e.payload.decisionId, decisionType: e.payload.decisionType ?? null, confidenceScore: e.payload.confidenceScore ?? null },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; businessId: string; decisionId: string }>(
    "decision.rejected",
    (e) => {
      void productAnalytics.track({
        type: "analytics.recommendation.rejected",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { decisionId: e.payload.decisionId },
      });
    },
  );

  repos.eventBus.subscribe<{ orgId: string; feedbackId: string }>(
    "support.feedback.submitted",
    (e) => {
      void productAnalytics.track({
        type: "analytics.feedback.submitted",
        orgId: e.payload.orgId,
        properties: { feedbackId: e.payload.feedbackId },
      });
    },
  );

  graphRuntime.start();

  graphRuntime.start();
  return {
    business: createBusinessController(createBusinessProfileService(repos)),
    businessMri: createBusinessMriController(createBusinessMriService(repos)),
    businessDna: createBusinessDnaController(createBusinessDnaService(repos)),
    businessHealth: createBusinessHealthController(createBusinessHealthService(repos)),
    businessCapability: createBusinessCapabilityController(createBusinessCapabilityService(repos)),
    businessTimeline: createBusinessTimelineController(createBusinessTimelineService(repos)),
    businessConstraint: createBusinessConstraintController(createBusinessConstraintService(repos)),
    businessRecommendation: createBusinessRecommendationController(createBusinessRecommendationService(repos)),
    toolFabric: createToolFabricController(toolFabric),
    loopRuntime,
    workflowGeneration,
    missionControl: createMissionControlController(createMissionControlService(repos)),
    observability,
    multiAgentRuntime,
    businessDecision,
    scenario,
    kpiMeasurement,
    businessGoal,
    executiveBriefing,
    rootCause,
    executionPlan,
    outcomeVerification,
    businessOperatingLoop,
    workspace,
    featureFlags,
    support,
    productAnalytics,
    customerHealth,
    betaInvite,
    marketplace,
    scheduler,
    bte,
    aiWorkforce,
    orgHealth,
    insight,
    customer: createCustomerController(createCustomerService(repos)),
    businessDiagnostic: createBusinessDiagnosticController(createBusinessDiagnosticService(repos)),
    businessContext,
    businessGraph,
    graphRuntime,
    businessSemantic,
    contextResolution: new ContextResolutionService(businessSemantic),
    dependencyResolution: new DependencyResolutionService(businessSemantic),
    businessQueries,
  };
}

export type BossApi = ReturnType<typeof createApiFromContainer>;

export function createInMemoryApi(): BossApi {
  const repos = createInMemoryContainer();
  const eventBus = new InMemoryEventBus();
  const auditSink = new InMemoryAuditSink();
  const businessContext = createBusinessContextService(
    repos,
    eventBus,
    auditSink,
  );
  const businessGraph = createBusinessGraphService(
    repos,
    businessContext,
    eventBus,
    auditSink,
  );
  const graphRuntime = createGraphRuntime(businessGraph, eventBus);
  const businessSemantic = createBusinessSemanticLayer(
    graphRuntime,
    businessContext,
    eventBus,
    auditSink,
  );
  const businessQueries = createBusinessQueryService(
    businessSemantic,
    eventBus,
    auditSink,
  );
  return createApiFromContainer(
    repos,
    businessContext,
    businessGraph,
    graphRuntime,
    businessSemantic,
    businessQueries,
  );
}

export function createApi(): BossApi {
  const repos = createPostgresContainer();
  const eventBus = new JournaledEventBus(
    new InMemoryEventBus(),
    new PostgresEventJournal(),
  );
  const auditSink = new PostgresAuditSink();
  const businessContext = createBusinessContextService(
    repos,
    eventBus,
    auditSink,
  );
  const businessGraph = createBusinessGraphService(
    repos,
    businessContext,
    eventBus,
    auditSink,
  );
  const graphRuntime = createGraphRuntime(businessGraph, eventBus);
  const businessSemantic = createBusinessSemanticLayer(
    graphRuntime,
    businessContext,
    eventBus,
    auditSink,
  );
  const businessQueries = createBusinessQueryService(
    businessSemantic,
    eventBus,
    auditSink,
  );
  return createApiFromContainer(
    repos,
    businessContext,
    businessGraph,
    graphRuntime,
    businessSemantic,
    businessQueries,
  );
}

export * from "./container.js";
export * from "./services/businessProfileService.js";
export * from "./services/businessMriService.js";
export * from "./services/businessDnaService.js";
export * from "./services/businessHealthService.js";
export * from "./services/businessCapabilityService.js";
export * from "./services/businessTimelineService.js";
export * from "./services/businessConstraintService.js";
export * from "./services/businessRecommendationService.js";
export * from "./services/toolFabricService.js";
export * from "./services/loopRuntimeService.js";
export * from "./services/workflowGenerationService.js";
export * from "./services/marketplaceService.js";
export * from "./services/missionControlService.js";
export * from "./services/observabilityService.js";
export * from "./services/multiAgentRuntimeService.js";
export * from "./services/businessDecisionService.js";
export * from "./services/scenarioService.js";
export * from "./services/kpiMeasurementService.js";
export * from "./services/businessGoalService.js";
export * from "./services/executiveBriefingService.js";
export * from "./services/rootCauseService.js";
export * from "./services/executionPlanService.js";
export * from "./services/outcomeVerificationService.js";
export * from "./services/businessOperatingLoopService.js";
export * from "./services/workspaceService.js";
export * from "./services/featureFlagService.js";
export * from "./services/supportService.js";
export * from "./services/productAnalyticsService.js";
export * from "./services/customerHealthService.js";
export * from "./services/betaInviteService.js";
export * from "./services/schedulerService.js";
export * from "./services/bteService.js";
export * from "./services/aiWorkforceService.js";
export * from "./services/orgHealthService.js";
export * from "./services/insightService.js";
export * from "./services/customerService.js";
export * from "./services/businessDiagnosticService.js";
export * from "./controllers/businessDiagnosticController.js";
export * from "./security.js";
export * from "./observability.js";
export * from "./health.js";
export * from "./identity.js";
export * from "./supabaseIdentityProvider.js";
export * from "./runtimePersistence.js";
export * from "./mvpJourney.js";
export * from "./organization.js";
export * from "./services/businessContextService.js";
export * from "./services/businessGraphService.js";
export * from "./services/businessGraphRuntime.js";
export * from "./services/businessSemanticLayer.js";
export * from "./services/businessQueryService.js";
export * from "./businessContextRuntime.js";
