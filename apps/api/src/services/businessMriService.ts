import { nowIso } from "@boss/shared";
import type { BusinessMRI, BusinessMriResponse, MriSectionKey } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface AnswerInput {
  sectionKey: MriSectionKey;
  questionKey: string;
  value: unknown;
}

export interface BusinessMriService {
  startMri(orgId: string, businessId: string): Promise<BusinessMRI>;
  answer(orgId: string, businessMriId: string, input: AnswerInput): Promise<BusinessMriResponse>;
  completeSection(orgId: string, businessMriId: string, sectionKey: MriSectionKey): Promise<void>;
  completeMri(orgId: string, businessMriId: string): Promise<BusinessMRI>;
  getResponses(orgId: string, businessMriId: string): Promise<BusinessMriResponse[]>;
}

export function createBusinessMriService(repos: RepositoryContainer): BusinessMriService {
  return {
    async startMri(orgId, businessId) {
      const existing = await repos.businessMri.findByBusinessId(orgId, businessId);
      if (existing) {
        return existing;
      }

      const mri = await repos.businessMri.create({
        orgId,
        businessId,
        version: "1.0.0",
        status: "in_progress",
        startedAt: nowIso(),
        completedAt: null,
      });

      await repos.businessTimeline.append({
        orgId,
        businessId,
        type: "business_mri_started",
        description: "Business MRI started",
        metadata: {},
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "business.mri.started",
        payload: { orgId, businessId, businessMriId: mri.id },
        occurredAt: nowIso(),
      });

      return mri;
    },
    async answer(orgId, businessMriId, input) {
      return repos.businessMri.upsertResponse({
        orgId,
        businessMriId,
        sectionKey: input.sectionKey,
        questionKey: input.questionKey,
        value: input.value,
        answeredAt: nowIso(),
      });
    },
    async completeSection(orgId, businessMriId, sectionKey) {
      await repos.businessMri.upsertSection({
        orgId,
        businessMriId,
        sectionKey,
        startedAt: nowIso(),
        completedAt: nowIso(),
      });
    },
    async completeMri(orgId, businessMriId) {
      const updated = await repos.businessMri.update(orgId, businessMriId, {
        status: "completed",
        completedAt: nowIso(),
      });

      await repos.businessTimeline.append({
        orgId,
        businessId: updated.businessId,
        type: "business_mri_completed",
        description: "Business MRI completed",
        metadata: {},
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "business.mri.completed",
        payload: { orgId, businessId: updated.businessId, businessMriId: updated.id },
        occurredAt: nowIso(),
      });

      return updated;
    },
    async getResponses(orgId, businessMriId) {
      return repos.businessMri.listResponses(orgId, businessMriId);
    },
  };
}
