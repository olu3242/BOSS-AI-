"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface UseInactivityTimeoutOptions {
  warningMs?: number;
  timeoutMs?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  enabled?: boolean;
}

interface UseInactivityTimeoutReturn {
  isWarning: boolean;
  secondsRemaining: number;
  dismiss: () => void;
}

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown", "touchstart", "scroll", "click",
] as const;

export function useInactivityTimeout({
  warningMs = 9 * 60 * 1000,
  timeoutMs = 10 * 60 * 1000,
  onWarning,
  onTimeout,
  enabled = true,
}: UseInactivityTimeoutOptions = {}): UseInactivityTimeoutReturn {
  const [isWarning, setIsWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const onWarningRef = useRef(onWarning);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => { onWarningRef.current = onWarning; }, [onWarning]);
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

  const clearAll = useCallback(() => {
    if (warningTimer.current) { clearTimeout(warningTimer.current); warningTimer.current = null; }
    if (timeoutTimer.current) { clearTimeout(timeoutTimer.current); timeoutTimer.current = null; }
    if (countdownTimer.current) { clearInterval(countdownTimer.current); countdownTimer.current = null; }
  }, []);

  const startCountdown = useCallback((seconds: number) => {
    setSecondsRemaining(seconds);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      setSecondsRemaining((s) => {
        if (s <= 1) {
          if (countdownTimer.current) clearInterval(countdownTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const startTimers = useCallback(() => {
    clearAll();
    warningTimer.current = setTimeout(() => {
      setIsWarning(true);
      onWarningRef.current?.();
      const remaining = Math.round((timeoutMs - warningMs) / 1000);
      startCountdown(remaining);
      timeoutTimer.current = setTimeout(() => {
        setIsWarning(false);
        clearAll();
        onTimeoutRef.current?.();
      }, timeoutMs - warningMs);
    }, warningMs);
  }, [clearAll, startCountdown, warningMs, timeoutMs]);

  const dismiss = useCallback(() => {
    setIsWarning(false);
    startTimers();
  }, [startTimers]);

  useEffect(() => {
    if (!enabled) {
      clearAll();
      setIsWarning(false);
      return;
    }

    startTimers();

    const handleActivity = () => {
      if (!isWarning) startTimers();
    };

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, handleActivity, { passive: true });
    }

    return () => {
      clearAll();
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, handleActivity);
      }
    };
  }, [enabled]); // startTimers captured via ref; enabled is the meaningful dep

  return { isWarning, secondsRemaining, dismiss };
}
