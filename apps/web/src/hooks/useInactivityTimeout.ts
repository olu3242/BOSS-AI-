"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseInactivityTimeoutOptions {
  warningMs?: number;  // default: 9 minutes
  timeoutMs?: number;  // default: 10 minutes
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

interface UseInactivityTimeoutReturn {
  isWarning: boolean;
  dismissWarning: () => void;
}

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

export function useInactivityTimeout({
  warningMs = 9 * 60 * 1000,
  timeoutMs = 10 * 60 * 1000,
  onWarning,
  onTimeout,
  enabled = true,
}: UseInactivityTimeoutOptions = {}): UseInactivityTimeoutReturn {
  const [isWarning, setIsWarning] = useState(false);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

  const clearTimers = useCallback(() => {
    if (warningTimer.current) { clearTimeout(warningTimer.current); warningTimer.current = null; }
    if (timeoutTimer.current) { clearTimeout(timeoutTimer.current); timeoutTimer.current = null; }
  }, []);

  const startTimers = useCallback(() => {
    clearTimers();
    warningTimer.current = setTimeout(() => {
      setIsWarning(true);
      onWarningRef.current?.();
      timeoutTimer.current = setTimeout(() => {
        onTimeoutRef.current?.();
      }, timeoutMs - warningMs);
    }, warningMs);
  }, [clearTimers, warningMs, timeoutMs]);

  const resetTimers = useCallback(() => {
    setIsWarning(false);
    startTimers();
  }, [startTimers]);

  const dismissWarning = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setIsWarning(false);
      return;
    }

    startTimers();

    const handleActivity = () => {
      if (!isWarning) resetTimers();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearTimers();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return { isWarning, dismissWarning };
}
