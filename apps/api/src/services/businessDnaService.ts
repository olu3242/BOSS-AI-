import { nowIso } from "@boss/shared";
import { deriveBusinessDna } from "@boss/mcp";
import type { BusinessDNA } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface BusinessDnaService {
  generate(orgId: string, businessId: string, businessMriId: string): Promise<BusinessDNA>;
  getDna(orgId: string, businessId: string): Promise<BusinessDNA | null>;
}

export function createBusinessDnaService(repos: RepositoryContainer): BusinessDnaService {
  return {
    async generate(orgId, businessId, businessMriId) {
      const responses = await repos.businessMri.listResponses(orgId, businessMriId);
      const derived = deriveBusinessDna(responses);

      const dna = await repos.businessDna.upsert({
        orgId,
        businessId,
        archetype: derived.archetype,
        growthStage: derived.growthStage,
        operationalComplexity: derived.operationalComplexity,
        technologyMaturity: derived.technologyMaturity,
        automationReadiness: derived.automationReadiness,
        customerEngagementStyle: derived.customerEngagementStyle,
        revenueModel: derived.revenueModel,
        communicationStyle: derived.communicationStyle,
        decisionStyle: derived.decisionStyle,
        riskProfile: derived.riskProfile,
        generatedAt: nowIso(),
      });

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "business_dna_generated",
        description: "Business DNA generated",
        metadata: {},
        occurredAt: nowIso(),
      });

      return dna;
    },
    async getDna(orgId, businessId) {
      return repos.businessDna.findByBusinessId(orgId, businessId);
    },
  };
}
