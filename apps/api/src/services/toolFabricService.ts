import { nowIso } from "@boss/shared";
import { resolveCapability } from "@boss/mcp";
import { dispatchProviderExecution } from "./providerAdapters/index.js";
import type {
  IntegrationAccount,
  PermissionPolicy,
  ProviderHealth,
  ToolAuditRecord,
  ToolExecution,
} from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface ToolRequestInput {
  capabilityKey: string;
  roleKey: string;
  requestedBy: string;
  input: Record<string, unknown>;
}

export interface ToolFabricService {
  connectIntegration(orgId: string, businessId: string, providerKey: string): Promise<IntegrationAccount>;
  disconnectIntegration(orgId: string, businessId: string, providerKey: string): Promise<IntegrationAccount>;
  listIntegrations(orgId: string, businessId: string): Promise<IntegrationAccount[]>;
  setPermission(
    orgId: string,
    businessId: string,
    input: { toolKey: string; roleKey: string; allowed: boolean; approval: PermissionPolicy["approval"]; rateLimitPerMinute: number | null }
  ): Promise<PermissionPolicy>;
  listPermissions(orgId: string, businessId: string): Promise<PermissionPolicy[]>;
  requestTool(orgId: string, businessId: string, request: ToolRequestInput): Promise<ToolExecution>;
  listExecutions(orgId: string, businessId: string): Promise<ToolExecution[]>;
  listAuditHistory(orgId: string, businessId: string): Promise<ToolAuditRecord[]>;
  listProviderHealth(orgId: string, businessId: string): Promise<ProviderHealth[]>;
}

export function createToolFabricService(repos: RepositoryContainer): ToolFabricService {
  return {
    async connectIntegration(orgId, businessId, providerKey) {
      return repos.integrationAccounts.upsert({
        orgId,
        businessId,
        providerKey,
        status: "connected",
        connectedAt: nowIso(),
        version: 1,
      });
    },
    async disconnectIntegration(orgId, businessId, providerKey) {
      return repos.integrationAccounts.upsert({
        orgId,
        businessId,
        providerKey,
        status: "disconnected",
        connectedAt: null,
        version: 1,
      });
    },
    async listIntegrations(orgId, businessId) {
      return repos.integrationAccounts.listByBusinessId(orgId, businessId);
    },
    async setPermission(orgId, businessId, input) {
      return repos.permissionPolicies.upsert({
        orgId,
        businessId,
        toolKey: input.toolKey,
        roleKey: input.roleKey,
        allowed: input.allowed,
        approval: input.approval,
        rateLimitPerMinute: input.rateLimitPerMinute,
        version: 1,
      });
    },
    async listPermissions(orgId, businessId) {
      return repos.permissionPolicies.listByBusinessId(orgId, businessId);
    },
    async requestTool(orgId, businessId, request) {
      const connected = await repos.integrationAccounts.listByBusinessId(orgId, businessId);
      const permissions = await repos.permissionPolicies.listByBusinessId(orgId, businessId);

      const resolved = resolveCapability(
        request.capabilityKey,
        connected.map((c) => ({ providerKey: c.providerKey, status: c.status })),
        request.roleKey,
        permissions.map((p) => ({ toolKey: p.toolKey, roleKey: p.roleKey, allowed: p.allowed, approval: p.approval }))
      );

      let execution = await repos.toolExecutions.create({
        orgId,
        businessId,
        toolKey: resolved.toolKey,
        capabilityKey: resolved.capabilityKey,
        providerKey: resolved.providerKey,
        requestedBy: request.requestedBy,
        status: "pending",
        input: request.input,
        output: null,
        errorMessage: null,
        startedAt: nowIso(),
        completedAt: null,
      });

      await repos.toolExecutions.addAuditRecord({
        orgId,
        businessId,
        toolExecutionId: execution.id,
        action: "tool.requested",
        actor: request.requestedBy,
        details: { toolKey: resolved.toolKey, providerKey: resolved.providerKey, approval: resolved.approval },
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: "tool.execution.requested",
        payload: { orgId, businessId, toolExecutionId: execution.id, toolKey: resolved.toolKey, providerKey: resolved.providerKey },
        occurredAt: nowIso(),
      });

      const result = await dispatchProviderExecution(repos, orgId, businessId, resolved, request.input);

      execution = await repos.toolExecutions.updateStatus(orgId, execution.id, result.status, result.output, result.errorMessage, {
        attemptCount: result.attemptCount,
        latencyMs: result.latencyMs,
      });

      await repos.toolExecutions.addAuditRecord({
        orgId,
        businessId,
        toolExecutionId: execution.id,
        action: `tool.${result.status}`,
        actor: request.requestedBy,
        details: { output: result.output, errorMessage: result.errorMessage },
        occurredAt: nowIso(),
      });

      await repos.eventBus.publish({
        type: `tool.execution.${result.status}`,
        payload: { orgId, businessId, toolExecutionId: execution.id, toolKey: resolved.toolKey, providerKey: resolved.providerKey },
        occurredAt: nowIso(),
      });

      await repos.providerHealth.upsert({
        orgId,
        businessId,
        providerKey: resolved.providerKey,
        status: result.status === "succeeded" ? "healthy" : "degraded",
        latencyMs: result.latencyMs > 0 ? result.latencyMs : null,
        failureCount: result.status === "succeeded" ? 0 : 1,
        quotaRemaining: null,
        authenticated: true,
        checkedAt: nowIso(),
      });

      return execution;
    },
    async listExecutions(orgId, businessId) {
      return repos.toolExecutions.listByBusinessId(orgId, businessId);
    },
    async listAuditHistory(orgId, businessId) {
      return repos.toolExecutions.listAuditRecords(orgId, businessId);
    },
    async listProviderHealth(orgId, businessId) {
      return repos.providerHealth.listByBusinessId(orgId, businessId);
    },
  };
}
