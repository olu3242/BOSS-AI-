import { createPostgresContainer } from "./container.js";
import { createBusinessProfileService } from "./services/businessProfileService.js";
import { createBusinessMriService } from "./services/businessMriService.js";
import { createBusinessDnaService } from "./services/businessDnaService.js";
import { createBusinessHealthService } from "./services/businessHealthService.js";
import { createBusinessCapabilityService } from "./services/businessCapabilityService.js";
import { createBusinessTimelineService } from "./services/businessTimelineService.js";
import { createBusinessConstraintService } from "./services/businessConstraintService.js";
import { createBusinessController } from "./controllers/businessController.js";
import { createBusinessMriController } from "./controllers/businessMriController.js";
import { createBusinessDnaController } from "./controllers/businessDnaController.js";
import { createBusinessHealthController } from "./controllers/businessHealthController.js";
import { createBusinessCapabilityController } from "./controllers/businessCapabilityController.js";
import { createBusinessTimelineController } from "./controllers/businessTimelineController.js";
import { createBusinessConstraintController } from "./controllers/businessConstraintController.js";

export function createApi() {
  const repos = createPostgresContainer();

  return {
    business: createBusinessController(createBusinessProfileService(repos)),
    businessMri: createBusinessMriController(createBusinessMriService(repos)),
    businessDna: createBusinessDnaController(createBusinessDnaService(repos)),
    businessHealth: createBusinessHealthController(createBusinessHealthService(repos)),
    businessCapability: createBusinessCapabilityController(createBusinessCapabilityService(repos)),
    businessTimeline: createBusinessTimelineController(createBusinessTimelineService(repos)),
    businessConstraint: createBusinessConstraintController(createBusinessConstraintService(repos)),
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
