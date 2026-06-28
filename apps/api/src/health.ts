export type RuntimeMode = "in_memory" | "postgres";

export interface EnvironmentDiagnostic {
  name: string;
  required: boolean;
  present: boolean;
  message: string;
}

export interface HealthCheckResult {
  status: "ok" | "degraded";
  runtimeMode: RuntimeMode;
  checkedAt: string;
  diagnostics: EnvironmentDiagnostic[];
}

export interface ExecutionRuntimeHealthResult {
  status: "ok" | "degraded" | "stopped";
  checkedAt: string;
  runtime: RuntimeHealth;
}

type RuntimeEnvironment = Record<string, string | undefined>;

export function validateEnvironment(
  runtimeMode: RuntimeMode,
  env: RuntimeEnvironment = process.env
): EnvironmentDiagnostic[] {
  const databaseRequired = runtimeMode === "postgres";
  return [
    {
      name: "DATABASE_URL",
      required: databaseRequired,
      present: Boolean(env.DATABASE_URL),
      message: env.DATABASE_URL
        ? "Postgres connection string configured."
        : databaseRequired
          ? "DATABASE_URL is required for Postgres runtime."
          : "Not required for in-memory runtime.",
    },
  ];
}

export function createHealthCheck(
  runtimeMode: RuntimeMode,
  env: RuntimeEnvironment = process.env
): HealthCheckResult {
  const diagnostics = validateEnvironment(runtimeMode, env);
  const hasMissingRequired = diagnostics.some((diagnostic) => diagnostic.required && !diagnostic.present);

  return {
    status: hasMissingRequired ? "degraded" : "ok",
    runtimeMode,
    checkedAt: new Date().toISOString(),
    diagnostics,
  };
}

export function createExecutionRuntimeHealth(
  runtime: RuntimeHealth,
): ExecutionRuntimeHealthResult {
  return {
    status:
      runtime.state === "running"
        ? runtime.deadLetterCount > 0
          ? "degraded"
          : "ok"
        : runtime.state === "degraded"
          ? "degraded"
          : "stopped",
    checkedAt: new Date().toISOString(),
    runtime,
  };
}
import type { RuntimeHealth } from "@boss/loop";
