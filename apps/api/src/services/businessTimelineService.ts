import type { BusinessTimelineEntry } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface BusinessTimelineService {
  list(orgId: string, businessId: string): Promise<BusinessTimelineEntry[]>;
}

export function createBusinessTimelineService(repos: RepositoryContainer): BusinessTimelineService {
  return {
    async list(orgId, businessId) {
      return repos.businessTimeline.listByBusinessId(orgId, businessId);
    },
  };
}
