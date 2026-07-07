import type { RepositoryContainer } from "../container.js";
import { createPolicyEngineService } from "./policyEngineService.js";

/**
 * Subscribes to canonical lifecycle events and routes each through the
 * PolicyEngine so configured LifecyclePolicies can fire automatically,
 * request approval, or flag manual action.
 *
 * The full chain:
 *   lead.converted → opportunity.created
 *   opportunity.won → estimate.requested
 *   estimate.accepted → appointment.scheduled
 *   appointment.completed → job.created
 *   job.completed → invoice.created
 *   invoice.paid → recommendation.workflow.run
 */
export function installLifecycleChain(repos: RepositoryContainer): void {
  const engine = createPolicyEngineService(
    repos.lifecyclePolicies,
    repos.workflows,
    repos.workflowRuns,
    repos.eventBus,
  );

  type BasePayload = { orgId: string; businessId: string };

  function wire<T extends BasePayload>(event: string, contextFn?: (p: T) => Record<string, unknown>): void {
    repos.eventBus.subscribe<T>(event, (e) => {
      const ctx: Record<string, unknown> = contextFn ? contextFn(e.payload) : {};
      void engine.evaluate(e.payload.orgId, e.payload.businessId, event, ctx);
    });
  }

  // Lead lifecycle
  wire<BasePayload & { leadId: string }>("lead.converted", (p) => ({ objectType: "lead", objectId: p.leadId }));
  wire<BasePayload & { leadId: string }>("lead.qualified", (p) => ({ objectType: "lead", objectId: p.leadId }));

  // Opportunity lifecycle
  wire<BasePayload & { opportunityId: string }>("opportunity.won", (p) => ({ objectType: "opportunity", objectId: p.opportunityId }));
  wire<BasePayload & { opportunityId: string }>("opportunity.lost", (p) => ({ objectType: "opportunity", objectId: p.opportunityId }));

  // Estimate lifecycle
  wire<BasePayload & { estimateId: string }>("estimate.accepted", (p) => ({ objectType: "estimate", objectId: p.estimateId }));
  wire<BasePayload & { estimateId: string }>("estimate.declined", (p) => ({ objectType: "estimate", objectId: p.estimateId }));
  wire<BasePayload & { estimateId: string }>("estimate.sent", (p) => ({ objectType: "estimate", objectId: p.estimateId }));

  // Appointment lifecycle
  wire<BasePayload & { appointmentId: string }>("appointment.completed", (p) => ({ objectType: "appointment", objectId: p.appointmentId }));
  wire<BasePayload & { appointmentId: string }>("appointment.no_show", (p) => ({ objectType: "appointment", objectId: p.appointmentId }));
  wire<BasePayload & { appointmentId: string }>("appointment.cancelled", (p) => ({ objectType: "appointment", objectId: p.appointmentId }));

  // Job lifecycle
  wire<BasePayload & { jobId: string }>("job.completed", (p) => ({ objectType: "job", objectId: p.jobId }));
  wire<BasePayload & { jobId: string }>("job.cancelled", (p) => ({ objectType: "job", objectId: p.jobId }));

  // Invoice lifecycle
  wire<BasePayload & { invoiceId: string }>("invoice.paid", (p) => ({ objectType: "invoice", objectId: p.invoiceId }));
  wire<BasePayload & { invoiceId: string }>("invoice.overdue", (p) => ({ objectType: "invoice", objectId: p.invoiceId }));

  // Payment lifecycle
  wire<BasePayload & { paymentId: string }>("payment.received", (p) => ({ objectType: "payment", objectId: p.paymentId }));
  wire<BasePayload & { paymentId: string }>("payment.failed", (p) => ({ objectType: "payment", objectId: p.paymentId }));

  // Review lifecycle
  wire<BasePayload & { reviewId: string }>("review.received", (p) => ({ objectType: "review", objectId: p.reviewId }));

  // Customer lifecycle
  wire<BasePayload & { customerId: string }>("customer.created", (p) => ({ objectType: "customer", objectId: p.customerId }));

  // Staff lifecycle
  wire<BasePayload & { staffId: string }>("staff.onboarded", (p) => ({ objectType: "staff", objectId: p.staffId }));
}
