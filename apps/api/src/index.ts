import { createInMemoryContainer, createPostgresContainer, type RepositoryContainer } from "./container.js";
import { createBusinessProfileService } from "./services/businessProfileService.js";
import { createBusinessMriService } from "./services/businessMriService.js";
import { createBusinessDnaService } from "./services/businessDnaService.js";
import { createBusinessHealthService } from "./services/businessHealthService.js";
import { createBusinessCapabilityService } from "./services/businessCapabilityService.js";
import { createBusinessTimelineService } from "./services/businessTimelineService.js";
import { createBusinessConstraintService } from "./services/businessConstraintService.js";
import { createBusinessRecommendationService } from "./services/businessRecommendationService.js";
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
import { createBusinessDiagnosticController } from "./controllers/businessDiagnosticController.js";

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
