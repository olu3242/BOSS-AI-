import type { EventLogRepository } from "@boss/db";

export interface CompactionResult {
  deletedCount: number;
  retentionDays: number;
  ranAt: string;
}

export interface EventLogCompactionService {
  /** Delete events older than retentionDays for a specific org. */
  compactForOrg(orgId: string, retentionDays?: number): Promise<CompactionResult>;
  /** Global sweep — deletes all events older than retentionDays across every org. */
  compactAll(retentionDays?: number): Promise<CompactionResult>;
}

export function createEventLogCompactionService(
  eventLog: EventLogRepository
): EventLogCompactionService {
  async function run(orgId: string | undefined, retentionDays: number): Promise<CompactionResult> {
    const deletedCount = await eventLog.compact(retentionDays, orgId);
    return { deletedCount, retentionDays, ranAt: new Date().toISOString() };
  }

  return {
    compactForOrg(orgId, retentionDays = 90) {
      return run(orgId, retentionDays);
    },
    compactAll(retentionDays = 90) {
      return run(undefined, retentionDays);
    },
  };
}
