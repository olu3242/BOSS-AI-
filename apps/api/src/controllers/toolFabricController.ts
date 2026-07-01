import type { ToolFabricService, ToolRequestInput } from "../services/toolFabricService.js";
import type { PermissionPolicy } from "@boss/types";

export function createToolFabricController(service: ToolFabricService) {
  return {
    connectIntegration: (orgId: string, businessId: string, providerKey: string) =>
      service.connectIntegration(orgId, businessId, providerKey),
    disconnectIntegration: (orgId: string, businessId: string, providerKey: string) =>
      service.disconnectIntegration(orgId, businessId, providerKey),
    listIntegrations: (orgId: string, businessId: string) => service.listIntegrations(orgId, businessId),
    setPermission: (
      orgId: string,
      businessId: string,
      input: { toolKey: string; roleKey: string; allowed: boolean; approval: PermissionPolicy["approval"]; rateLimitPerMinute: number | null }
    ) => service.setPermission(orgId, businessId, input),
    listPermissions: (orgId: string, businessId: string) => service.listPermissions(orgId, businessId),
    requestTool: (orgId: string, businessId: string, request: ToolRequestInput) =>
      service.requestTool(orgId, businessId, request),
    listExecutions: (orgId: string, businessId: string) => service.listExecutions(orgId, businessId),
    listAuditHistory: (orgId: string, businessId: string) => service.listAuditHistory(orgId, businessId),
    listProviderHealth: (orgId: string, businessId: string) => service.listProviderHealth(orgId, businessId),
  };
}
