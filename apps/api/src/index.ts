import { createPostgresContainer, type RepositoryContainer } from "./container.js";
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
import { createObservabilityService } from "./services/observabilityService.js";
import { createMultiAgentRuntimeService } from "./services/multiAgentRuntimeService.js";
import { createBusinessDecisionService } from "./services/businessDecisionService.js";
import { createScenarioService } from "./services/scenarioService.js";
import { createKpiMeasurementService } from "./services/kpiMeasurementService.js";
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

export function createApi() {
  return createApiFromContainer(createPostgresContainer());
}

export function createApiFromContainer(repos: RepositoryContainer) {
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
        event.payload.recommendationId
      );
    }
  );

  const kpiMeasurement = createKpiMeasurementService(repos);
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

  // Product analytics: bridge domain events → analytics events
  repos.eventBus.subscribe<{ orgId: string; businessId: string; industry?: string; employeeCount?: number }>(
    "business.created",
    (e) => {
      void productAnalytics.track({
        type: "analytics.business.created",
        orgId: e.payload.orgId,
        businessId: e.payload.businessId,
        properties: { industry: e.payload.industry ?? null, employeeCount: e.payload.employeeCount ?? null },
      });
    }
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
    }
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
    }
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
    }
  );

  repos.eventBus.subscribe<{ orgId: string; feedbackId: string }>(
    "support.feedback.submitted",
    (e) => {
      void productAnalytics.track({
        type: "analytics.feedback.submitted",
        orgId: e.payload.orgId,
        properties: { feedbackId: e.payload.feedbackId },
      });
    }
  );

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
  };
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
