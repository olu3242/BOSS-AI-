import { providerDefinitionRegistry, toolDefinitionRegistry, capabilityContractRegistry } from "@boss/registries";

export interface ConnectedIntegrationInput {
  providerKey: string;
  status: "connected" | "disconnected" | "error";
}

export interface PermissionInput {
  toolKey: string;
  roleKey: string;
  allowed: boolean;
  approval: "auto" | "approval_required" | "executive_review" | "manual_only";
}

export interface ResolvedTool {
  toolKey: string;
  capabilityKey: string;
  providerKey: string;
  requiredPermissions: string[];
  approval: "auto" | "approval_required" | "executive_review" | "manual_only";
}

export class CapabilityNotFoundError extends Error {
  constructor(capabilityKey: string) {
    super(`No tool is registered for capability "${capabilityKey}"`);
  }
}

export class NoConnectedProviderError extends Error {
  constructor(capabilityKey: string) {
    super(`No connected, supported provider is available for capability "${capabilityKey}"`);
  }
}

export class PermissionDeniedError extends Error {
  constructor(toolKey: string, roleKey: string) {
    super(`Role "${roleKey}" is not permitted to use tool "${toolKey}"`);
  }
}

/**
 * Resolves a capability request to a concrete Tool + Provider, given the
 * business's currently connected integrations. Deterministic — never picks
 * a provider the business hasn't connected, never invents one.
 */
export function resolveCapability(
  capabilityKey: string,
  connectedIntegrations: ConnectedIntegrationInput[],
  roleKey: string,
  permissions: PermissionInput[]
): ResolvedTool {
  if (!capabilityContractRegistry.get(capabilityKey)) {
    throw new CapabilityNotFoundError(capabilityKey);
  }

  const tool = toolDefinitionRegistry.list().find((entry) => entry.capabilityKey === capabilityKey);
  if (!tool) {
    throw new CapabilityNotFoundError(capabilityKey);
  }

  const connectedKeys = new Set(
    connectedIntegrations.filter((integration) => integration.status === "connected").map((integration) => integration.providerKey)
  );

  const providerKey = tool.supportedProviderKeys.find((key) => connectedKeys.has(key) && providerDefinitionRegistry.get(key));
  if (!providerKey) {
    throw new NoConnectedProviderError(capabilityKey);
  }

  const permission = permissions.find((p) => p.toolKey === tool.toolKey && p.roleKey === roleKey);
  const approval = permission?.approval ?? "approval_required";
  if (permission && !permission.allowed) {
    throw new PermissionDeniedError(tool.toolKey, roleKey);
  }

  return {
    toolKey: tool.toolKey,
    capabilityKey: tool.capabilityKey,
    providerKey,
    requiredPermissions: tool.requiredPermissions,
    approval,
  };
}

export interface SimulatedExecutionResult {
  status: "succeeded" | "failed";
  output: Record<string, unknown> | null;
  errorMessage: string | null;
}

/**
 * Execution Adapter — no real provider call is made here (no network
 * client exists in MCP, by Law 1). This produces a deterministic simulated
 * result so the rest of the fabric (audit, health, events) has something
 * real to record against, until a Loop Runtime adapter performs the live
 * call against the resolved provider.
 */
export function executeToolRequestSimulated(resolved: ResolvedTool, input: Record<string, unknown>): SimulatedExecutionResult {
  return {
    status: "succeeded",
    output: { simulated: true, toolKey: resolved.toolKey, providerKey: resolved.providerKey, echo: input },
    errorMessage: null,
  };
}
