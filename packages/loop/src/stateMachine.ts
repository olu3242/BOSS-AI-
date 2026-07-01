import type { ExecutionState } from "@boss/types";

const TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  pending: ["queued", "cancelled"],
  queued: ["running", "cancelled"],
  running: ["waiting", "completed", "failed", "timed_out", "cancelled"],
  waiting: ["approved", "rejected", "cancelled"],
  approved: ["running"],
  rejected: ["cancelled"],
  completed: [],
  failed: ["queued", "rolled_back"],
  cancelled: [],
  rolled_back: [],
  timed_out: ["queued", "rolled_back"],
};

export class InvalidStateTransitionError extends Error {
  constructor(from: ExecutionState, to: ExecutionState) {
    super(`Invalid execution state transition: ${from} -> ${to}`);
  }
}

export function canTransition(from: ExecutionState, to: ExecutionState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ExecutionState, to: ExecutionState): void {
  if (!canTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to);
  }
}
