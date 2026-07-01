import { randomUUID } from "node:crypto";
import type { RepositoryContainer } from "../container.js";

export interface FeedbackInput {
  orgId: string;
  message: string;
  businessId?: string | null;
  pageUrl?: string | null;
  category?: string;
}

export interface SupportService {
  submitFeedback(input: FeedbackInput): Promise<{ feedbackId: string; status: string }>;
}

export function createSupportService(repos: RepositoryContainer): SupportService {
  return {
    async submitFeedback(input) {
      const feedbackId = randomUUID();
      await repos.eventBus.publish({
        type: "support.feedback.submitted",
        payload: {
          feedbackId,
          orgId: input.orgId,
          businessId: input.businessId ?? null,
          message: input.message.trim(),
          pageUrl: input.pageUrl ?? null,
          category: input.category ?? "general",
          platformVersion: process.env.npm_package_version ?? "0.9.0-rc1",
        },
        occurredAt: new Date().toISOString(),
      });
      return { feedbackId, status: "received" };
    },
  };
}
