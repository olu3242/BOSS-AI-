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
export * from "./services/missionControlService.js";
export * from "./services/observabilityService.js";
export * from "./services/multiAgentRuntimeService.js";
export * from "./services/businessDecisionService.js";
export * from "./services/scenarioService.js";
export * from "./services/kpiMeasurementService.js";
