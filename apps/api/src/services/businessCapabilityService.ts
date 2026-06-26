import { nowIso } from "@boss/shared";
import { evaluateCapabilities } from "@boss/mcp";
import type { BusinessCapabilityAssessment, BusinessDNA } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface BusinessCapabilityService {
  evaluate(
    orgId: string,
    businessId: string,
    businessMriId: string,
    dna: BusinessDNA
  ): Promise<BusinessCapabilityAssessment[]>;
  list(orgId: string, businessId: string): Promise<BusinessCapabilityAssessment[]>;
}

export function createBusinessCapabilityService(repos: RepositoryContainer): BusinessCapabilityService {
  return {
    async evaluate(orgId, businessId, businessMriId, dna) {
      const responses = await repos.businessMri.listResponses(orgId, businessMriId);
      const derived = evaluateCapabilities(responses, {
        archetype: dna.archetype,
        growthStage: dna.growthStage,
        operationalComplexity: dna.operationalComplexity,
        technologyMaturity: dna.technologyMaturity,
        automationReadiness: dna.automationReadiness,
        customerEngagementStyle: dna.customerEngagementStyle,
        revenueModel: dna.revenueModel,
        communicationStyle: dna.communicationStyle,
        decisionStyle: dna.decisionStyle,
        riskProfile: dna.riskProfile,
      });

      const capabilities = await Promise.all(
        derived.map((capability) =>
          repos.businessCapabilities.upsert({
            orgId,
            businessId,
            capabilityKey: capability.capabilityKey,
            currentMaturity: capability.currentMaturity,
            businessImportance: capability.businessImportance,
            automationPotential: capability.automationPotential,
            dependencies: capability.dependencies,
            owner: capability.owner,
          })
        )
      );

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "capability_updated",
        description: "Capability Graph evaluated",
        metadata: {},
        occurredAt: nowIso(),
      });

      return capabilities;
    },
    async list(orgId, businessId) {
      return repos.businessCapabilities.listByBusinessId(orgId, businessId);
    },
  };
}
