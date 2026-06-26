import type { MriSectionKey } from "@boss/types";
import type { AnswerInput, BusinessMriService } from "../services/businessMriService.js";

export function createBusinessMriController(service: BusinessMriService) {
  return {
    start: (orgId: string, businessId: string) => service.startMri(orgId, businessId),
    answer: (orgId: string, businessMriId: string, input: AnswerInput) => service.answer(orgId, businessMriId, input),
    completeSection: (orgId: string, businessMriId: string, sectionKey: MriSectionKey) =>
      service.completeSection(orgId, businessMriId, sectionKey),
    complete: (orgId: string, businessMriId: string) => service.completeMri(orgId, businessMriId),
    getResponses: (orgId: string, businessMriId: string) => service.getResponses(orgId, businessMriId),
  };
}
