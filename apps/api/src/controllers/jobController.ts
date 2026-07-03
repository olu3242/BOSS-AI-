import type { JobService } from "../services/jobService.js";

export function createJobController(service: JobService) {
  return {
    list: (orgId: string, businessId: string) => service.listJobsByBusiness(orgId, businessId),
    get: (orgId: string, jobId: string) => service.getJob(orgId, jobId),
    create: (orgId: string, businessId: string, input: Parameters<JobService["createJob"]>[2]) =>
      service.createJob(orgId, businessId, input),
    update: (orgId: string, jobId: string, patch: Parameters<JobService["updateJob"]>[2]) =>
      service.updateJob(orgId, jobId, patch),
    start: (orgId: string, jobId: string) => service.startJob(orgId, jobId),
    complete: (orgId: string, jobId: string, actualDurationMinutes?: number) =>
      service.completeJob(orgId, jobId, actualDurationMinutes),
    delete: (orgId: string, jobId: string) => service.deleteJob(orgId, jobId),
  };
}
