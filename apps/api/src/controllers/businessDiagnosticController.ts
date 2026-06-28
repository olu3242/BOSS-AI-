import type { ExecutionContext } from "@boss/loop";
import type { DiagnosticWeightProfile } from "@boss/types";
import type { BusinessDiagnosticService } from "../services/businessDiagnosticService.js";

export function createBusinessDiagnosticController(
  service: BusinessDiagnosticService,
) {
  return {
    generate: (
      orgId: string,
      businessId: string,
      businessMriId: string,
      context: ExecutionContext,
      weightProfile?: DiagnosticWeightProfile,
    ) =>
      service.generate(
        orgId,
        businessId,
        businessMriId,
        context,
        weightProfile,
      ),
    getLatest: (orgId: string, businessId: string) =>
      service.getLatest(orgId, businessId),
    listVersions: (orgId: string, businessId: string) =>
      service.listVersions(orgId, businessId),
  };
}
