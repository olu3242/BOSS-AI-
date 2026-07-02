import { createApi } from "@boss/api";
import {
  buildCommandCenterSnapshot,
  type CommandCenterSnapshot,
} from "./commandCenter.js";

export interface LiveCommandCenterResult {
  snapshot: CommandCenterSnapshot | null;
  /** True when the org has no businesses yet — show onboarding CTA. */
  isEmpty: boolean;
}

/**
 * Fetches live Command Center data for the authenticated organization.
 * Uses the Postgres-backed API. Falls back gracefully when no business
 * profile exists (new org, pre-onboarding).
 */
export async function createLiveCommandCenter(
  orgId: string,
): Promise<LiveCommandCenterResult> {
  const api = createApi();

  const businesses = await api.business.list(orgId);
  if (businesses.length === 0) {
    return { snapshot: null, isEmpty: true };
  }

  // Single-business MVP — multi-business selector is a separate workstream.
  const business = businesses[0]!;
  const businessId = business.id;

  const [
    profileResult,
    dnaResult,
    healthResult,
    capabilitiesResult,
    constraintsResult,
    constraintPrioritiesResult,
    recommendationsResult,
    recommendationPrioritiesResult,
    roadmapResult,
    timelineResult,
  ] = await Promise.allSettled([
    api.business.getProfile(orgId, businessId),
    api.businessDna.getDna(orgId, businessId),
    api.businessHealth.getHealth(orgId, businessId),
    api.businessCapability.list(orgId, businessId),
    api.businessConstraint.list(orgId, businessId),
    api.businessConstraint.getPriorities(orgId, businessId),
    api.businessRecommendation.list(orgId, businessId),
    api.businessRecommendation.getPriorities(orgId, businessId),
    api.businessRecommendation.getRoadmap(orgId, businessId),
    api.businessTimeline.list(orgId, businessId),
  ]);

  const profile = settled(profileResult);
  const dna = settled(dnaResult);
  const healthData = settled(healthResult);

  // If MRI hasn't been completed yet, core analytics won't exist.
  if (!profile || !dna || !healthData) {
    return { snapshot: null, isEmpty: false };
  }

  const capabilities = settled(capabilitiesResult) ?? [];
  const constraints = settled(constraintsResult) ?? [];
  const constraintPriorities = settled(constraintPrioritiesResult) ?? [];
  const recommendations = settled(recommendationsResult) ?? [];
  const recommendationPriorities = settled(recommendationPrioritiesResult) ?? [];
  const roadmap = settled(roadmapResult) ?? {
    id: "",
    orgId,
    businessId,
    stages: [],
    generatedAt: new Date().toISOString(),
    version: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  };
  const timeline = settled(timelineResult) ?? [];

  const snapshot = buildCommandCenterSnapshot({
    business,
    profile,
    dna,
    health: healthData.health,
    healthDimensions: healthData.dimensions,
    capabilities,
    constraints,
    constraintPriorities,
    recommendations,
    recommendationPriorities,
    roadmap,
    timeline,
  });

  return { snapshot, isEmpty: false };
}

function settled<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === "fulfilled" ? result.value : null;
}
