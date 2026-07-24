"use client";

import { useState, useCallback, useRef } from "react";
import { ApiClientError } from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeatureStatus = "idle" | "loading" | "success" | "degraded" | "error";

export interface FeatureDependency {
  name: string;
  status: "healthy" | "degraded" | "offline" | "unknown";
  latencyMs?: number;
  error?: string;
}

export interface FeatureRuntimeState<T> {
  status: FeatureStatus;
  data: T | null;
  error: FeatureRuntimeError | null;
  dependencies: FeatureDependency[];
  correlationId: string | null;
  latencyMs: number | null;
  retryCount: number;
  lastSuccessAt: string | null;
}

export interface FeatureRuntimeError {
  code: string;
  message: string;
  httpStatus?: number;
  dependency?: string;
  correlationId: string;
  traceId?: string;
  retryable: boolean;
}

export interface FeatureRuntimeActions<T> {
  load: () => Promise<void>;
  retry: () => Promise<void>;
  setData: (data: T) => void;
}

// ─── Error classification ─────────────────────────────────────────────────────

function classifyError(err: unknown, feature: string, dependency?: string): FeatureRuntimeError {
  const correlationId = crypto.randomUUID();
  const dep = dependency ?? feature;

  if (err instanceof ApiClientError) {
    const status = err.status;
    if (status === 401 || status === 403) {
      return {
        code: `${feature.toUpperCase().replace(/\s+/g, "_")}_UNAUTHORIZED`,
        message: "Session expired or insufficient permissions.",
        httpStatus: status,
        dependency: dep,
        correlationId,
        traceId: err.body.traceId,
        retryable: status === 401,
      };
    }
    if (status === 404) {
      return {
        code: `${dep.toUpperCase().replace(/\s+/g, "_")}_NOT_FOUND`,
        message: `${dependency ?? feature} resource not found.`,
        httpStatus: status,
        dependency: dep,
        correlationId,
        traceId: err.body.traceId,
        retryable: false,
      };
    }
    if (status >= 500) {
      return {
        code: `${dep.toUpperCase().replace(/\s+/g, "_")}_SERVICE_ERROR`,
        message: err.body.message ?? `${dependency ?? feature} service returned an error.`,
        httpStatus: status,
        dependency: dep,
        correlationId,
        traceId: err.body.traceId,
        retryable: true,
      };
    }
    return {
      code: `${dep.toUpperCase().replace(/\s+/g, "_")}_REQUEST_FAILED`,
      message: err.body.message ?? "Request failed.",
      httpStatus: status,
      dependency: dep,
      correlationId,
      traceId: err.body.traceId,
      retryable: status >= 429,
    };
  }

  if (err instanceof Error) {
    if (err.message === "Not authenticated" || err.message.includes("Not authenticated")) {
      return {
        code: "SESSION_EXPIRED",
        message: "Your session has expired. Please sign in again.",
        dependency: "Session",
        correlationId,
        retryable: false,
      };
    }
    if (err.name === "TypeError" && err.message.includes("fetch")) {
      return {
        code: `${dep.toUpperCase().replace(/\s+/g, "_")}_NETWORK_ERROR`,
        message: `Cannot reach ${dependency ?? feature} service. Check your connection.`,
        dependency: dep,
        correlationId,
        retryable: true,
      };
    }
  }

  return {
    code: `${feature.toUpperCase().replace(/\s+/g, "_")}_FETCH_FAILED`,
    message: `Failed to load ${feature.toLowerCase()}.`,
    dependency: dep,
    correlationId,
    retryable: true,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFeatureRuntime<T>(
  featureName: string,
  loader: () => Promise<{ data: T; dependencies?: FeatureDependency[] }>,
): [FeatureRuntimeState<T>, FeatureRuntimeActions<T>] {
  const [state, setState] = useState<FeatureRuntimeState<T>>({
    status: "idle",
    data: null,
    error: null,
    dependencies: [],
    correlationId: null,
    latencyMs: null,
    retryCount: 0,
    lastSuccessAt: null,
  });

  const retryCountRef = useRef(0);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, status: "loading", error: null }));
    const start = Date.now();
    try {
      const result = await loader();
      const latencyMs = Date.now() - start;
      setState((prev) => ({
        ...prev,
        status: "success",
        data: result.data,
        dependencies: result.dependencies ?? [],
        latencyMs,
        error: null,
        lastSuccessAt: new Date().toISOString(),
        retryCount: 0,
      }));
      retryCountRef.current = 0;
    } catch (err) {
      const latencyMs = Date.now() - start;
      const runtimeError = classifyError(err, featureName);
      retryCountRef.current += 1;
      setState((prev) => ({
        ...prev,
        status: "error",
        error: runtimeError,
        latencyMs,
        correlationId: runtimeError.correlationId,
        retryCount: retryCountRef.current,
      }));
    }
  }, [featureName, loader]);

  const retry = useCallback(async () => {
    await load();
  }, [load]);

  const setData = useCallback((data: T) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  return [state, { load, retry, setData }];
}

// ─── Error display helpers ────────────────────────────────────────────────────

export function errorCodeLabel(code: string): string {
  return code
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}
