"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface WorkflowSessionPayload {
  userId: string;
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  formData: Record<string, unknown>;
  validationState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

interface WorkflowSession {
  id: string;
  currentStep: number;
  completedSteps: number[];
  totalSteps: number;
  formData: Record<string, unknown>;
  validationState: Record<string, unknown>;
  metadata: Record<string, unknown>;
  status: string;
  version: number;
}

interface UseWorkflowSessionOptions {
  workflowType: string;
  userId: string;
  totalSteps: number;
  debounceMs?: number;
  onResumed?: (session: WorkflowSession) => void;
}

interface UseWorkflowSessionReturn {
  saveStatus: SaveStatus;
  resumedSession: WorkflowSession | null;
  save: (payload: Omit<WorkflowSessionPayload, "userId" | "totalSteps">) => void;
  complete: () => Promise<void>;
  cancel: () => Promise<void>;
}

export function useWorkflowSession({
  workflowType,
  userId,
  totalSteps,
  debounceMs = 500,
  onResumed,
}: UseWorkflowSessionOptions): UseWorkflowSessionReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [resumedSession, setResumedSession] = useState<WorkflowSession | null>(null);
  const pendingPayload = useRef<WorkflowSessionPayload | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // On mount, check for an active session to resume
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/workflow-sessions/${workflowType}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data: { session: WorkflowSession | null }) => {
        if (cancelled || !isMounted.current) return;
        if (data.session && data.session.status === "in_progress") {
          setResumedSession(data.session);
          onResumed?.(data.session);
        }
      })
      .catch(() => void 0);
    return () => { cancelled = true; };
  }, [workflowType]); // onResumed intentionally excluded — callers pass inline functions

  const flush = useCallback(async (payload: WorkflowSessionPayload) => {
    if (!isMounted.current) return;
    setSaveStatus("saving");
    try {
      const res = await fetch(`/api/v1/workflow-sessions/${workflowType}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      if (isMounted.current) setSaveStatus("saved");
    } catch {
      if (isMounted.current) setSaveStatus("error");
    }
  }, [workflowType]);

  const save = useCallback((data: Omit<WorkflowSessionPayload, "userId" | "totalSteps">) => {
    const payload: WorkflowSessionPayload = { ...data, userId, totalSteps };
    pendingPayload.current = payload;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (pendingPayload.current) {
        void flush(pendingPayload.current);
        pendingPayload.current = null;
      }
    }, debounceMs);
  }, [userId, totalSteps, debounceMs, flush]);

  // Save before page unload / tab close
  useEffect(() => {
    const handleUnload = () => {
      if (pendingPayload.current) {
        const payload = pendingPayload.current;
        navigator.sendBeacon(
          `/api/v1/workflow-sessions/${workflowType}`,
          JSON.stringify(payload),
        );
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [workflowType]);

  // Save when tab becomes hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && pendingPayload.current) {
        void flush(pendingPayload.current);
        pendingPayload.current = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flush]);

  const complete = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await fetch(`/api/v1/workflow-sessions/${workflowType}/complete`, {
      method: "POST",
      credentials: "include",
    });
  }, [workflowType]);

  const cancel = useCallback(async () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await fetch(`/api/v1/workflow-sessions/${workflowType}/cancel`, {
      method: "POST",
      credentials: "include",
    });
  }, [workflowType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return { saveStatus, resumedSession, save, complete, cancel };
}
