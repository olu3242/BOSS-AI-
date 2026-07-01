import type { MissionControlService } from "../services/missionControlService.js";

export function createMissionControlController(service: MissionControlService) {
  return {
    getSnapshot: (orgId: string, businessId: string) => service.getSnapshot(orgId, businessId),
  };
}
