import type { Job, JobStatus, JobPriority } from "@boss/types";
import type { RepositoryContainer } from "../container.js";

export interface JobService {
  createJob(orgId: string, businessId: string, input: {
    title: string;
    description?: string | null;
    customerId?: string | null;
    status?: JobStatus;
    priority?: JobPriority;
    assignedTo?: string | null;
    scheduledAt?: string | null;
    estimatedDurationMinutes?: number | null;
    location?: string | null;
    notes?: string | null;
    tags?: string[];
  }): Promise<Job>;

  getJob(orgId: string, jobId: string): Promise<Job>;

  updateJob(orgId: string, jobId: string, patch: Partial<{
    title: string;
    description: string | null;
    customerId: string | null;
    status: JobStatus;
    priority: JobPriority;
    assignedTo: string | null;
    scheduledAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    estimatedDurationMinutes: number | null;
    actualDurationMinutes: number | null;
    location: string | null;
    notes: string | null;
    tags: string[];
  }>): Promise<Job>;

  startJob(orgId: string, jobId: string): Promise<Job>;
  completeJob(orgId: string, jobId: string, actualDurationMinutes?: number): Promise<Job>;

  listJobsByBusiness(orgId: string, businessId: string): Promise<Job[]>;
  listJobsByCustomer(orgId: string, customerId: string): Promise<Job[]>;

  deleteJob(orgId: string, jobId: string): Promise<void>;
}

export function createJobService(repos: RepositoryContainer): JobService {
  return {
    async createJob(orgId, businessId, input) {
      const job = await repos.jobs.create({
        orgId,
        businessId,
        customerId: input.customerId ?? null,
        title: input.title,
        description: input.description ?? null,
        status: input.status ?? 'scheduled',
        priority: input.priority ?? 'normal',
        assignedTo: input.assignedTo ?? null,
        scheduledAt: input.scheduledAt ?? null,
        startedAt: null,
        completedAt: null,
        estimatedDurationMinutes: input.estimatedDurationMinutes ?? null,
        actualDurationMinutes: null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        tags: input.tags ?? [],
        metadata: {},
      });

      await repos.eventBus.publish({
        type: "job.created",
        payload: { orgId, businessId, jobId: job.id, status: job.status },
        occurredAt: new Date().toISOString(),
      });

      return job;
    },

    async getJob(orgId, jobId) {
      const job = await repos.jobs.findById(orgId, jobId);
      if (!job) throw new Error(`Job ${jobId} not found`);
      return job;
    },

    async updateJob(orgId, jobId, patch) {
      const existing = await repos.jobs.findById(orgId, jobId);
      if (!existing) throw new Error(`Job ${jobId} not found`);
      const previousStatus = existing.status;

      const job = await repos.jobs.update(orgId, jobId, patch);

      if (patch.status && patch.status !== previousStatus) {
        await repos.eventBus.publish({
          type: "job.status_changed",
          payload: { orgId, jobId, previousStatus, newStatus: patch.status },
          occurredAt: new Date().toISOString(),
        });
      }

      return job;
    },

    async startJob(orgId, jobId) {
      const job = await repos.jobs.update(orgId, jobId, {
        status: 'in_progress',
        startedAt: new Date().toISOString(),
      });

      await repos.eventBus.publish({
        type: "job.status_changed",
        payload: { orgId, jobId, previousStatus: 'scheduled', newStatus: 'in_progress' },
        occurredAt: new Date().toISOString(),
      });

      return job;
    },

    async completeJob(orgId, jobId, actualDurationMinutes) {
      const now = new Date().toISOString();
      const job = await repos.jobs.update(orgId, jobId, {
        status: 'completed',
        completedAt: now,
        actualDurationMinutes: actualDurationMinutes ?? null,
      });

      await repos.eventBus.publish({
        type: "job.completed",
        payload: { orgId, jobId, completedAt: now },
        occurredAt: now,
      });

      return job;
    },

    async listJobsByBusiness(orgId, businessId) {
      return repos.jobs.listByBusiness(orgId, businessId);
    },

    async listJobsByCustomer(orgId, customerId) {
      return repos.jobs.listByCustomer(orgId, customerId);
    },

    async deleteJob(orgId, jobId) {
      await repos.jobs.softDelete(orgId, jobId);
    },
  };
}
