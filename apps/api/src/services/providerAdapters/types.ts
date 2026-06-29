import type { ResolvedTool } from "@boss/mcp";

export interface ResolvedCredential {
  secretRef: string;
  value: string;
}

export interface ProviderAdapterResult {
  status: "succeeded" | "failed";
  output: Record<string, unknown> | null;
  errorMessage: string | null;
  latencyMs: number;
}

export interface ProviderAdapter {
  providerKey: string;
  execute(
    resolved: ResolvedTool,
    input: Record<string, unknown>,
    credential: ResolvedCredential
  ): Promise<ProviderAdapterResult>;
}

