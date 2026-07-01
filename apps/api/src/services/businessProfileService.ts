import { nowIso } from "@boss/shared";
import type { Business, BusinessProfile } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface CreateBusinessInput {
  orgId: string;
  name: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  businessType: string;
  yearsOperating: number;
  locationCount: number;
  businessHours: string;
}

export interface BusinessProfileService {
  createBusiness(input: CreateBusinessInput): Promise<{ business: Business; profile: BusinessProfile }>;
  getProfile(orgId: string, businessId: string): Promise<BusinessProfile | null>;
}

export function createBusinessProfileService(repos: RepositoryContainer): BusinessProfileService {
  return {
    async createBusiness(input) {
      const business = await repos.businesses.create({
        orgId: input.orgId,
        name: input.name,
        industry: input.industry,
        employeeCount: input.employeeCount,
        annualRevenue: input.annualRevenue,
      });

      const profile = await repos.businessProfiles.upsert({
        orgId: input.orgId,
        businessId: business.id,
        businessName: input.name,
        businessType: input.businessType,
        yearsOperating: input.yearsOperating,
        employeeCount: input.employeeCount,
        locationCount: input.locationCount,
        businessHours: input.businessHours,
      });

      await repos.businessTimeline.append({
        orgId: input.orgId,
        businessId: business.id,
        type: "business_created",
        description: `Business created: ${business.name}`,
        metadata: {},
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "business.created",
        payload: { orgId: input.orgId, businessId: business.id, industry: input.industry },
        occurredAt: nowIso(),
      });

      return { business, profile };
    },
    async getProfile(orgId, businessId) {
      return repos.businessProfiles.findByBusinessId(orgId, businessId);
    },
  };
}
