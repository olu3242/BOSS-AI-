const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export interface ApiErrorBody {
  code: string;
  message: string;
  details: unknown;
  traceId: string;
}

export class ApiClientError extends Error {
  constructor(public readonly status: number, public readonly body: ApiErrorBody) {
    super(body.message);
  }
}

/**
 * Returns a bearer token for API calls.
 *
 * In development/demo environments the API exposes a /auth/dev-token route
 * that mints a signed JWT from an org_id (TD-030: no real auth UI yet).
 * In production that route is disabled; set NEXT_PUBLIC_STATIC_TOKEN to a
 * pre-minted service token issued by the real Supabase project instead.
 */
async function getBearerToken(orgId: string): Promise<string> {
  const staticToken = process.env.NEXT_PUBLIC_STATIC_TOKEN;
  if (staticToken) return staticToken;

  // In browser context, exchange the session cookie for a BOSS JWT via the
  // Next.js proxy route which reads requireActiveTenant() server-side.
  if (typeof window !== "undefined") {
    const res = await fetch("/api/auth/token");
    if (!res.ok) throw new Error("Not authenticated");
    const body = (await res.json()) as { token: string; orgId: string };
    return body.token;
  }

  // Server-side: mint directly from the known orgId (dev/staging only).
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/dev-token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orgId }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new ApiClientError(res.status, body as ApiErrorBody);
  }
  return (body as { token: string }).token;
}

async function request<T>(orgId: string, path: string, init?: RequestInit): Promise<T> {
  const token = await getBearerToken(orgId);
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) {
    throw new ApiClientError(res.status, body as ApiErrorBody);
  }
  return body as T;
}

export const apiClient = {
  getBusiness: (orgId: string, businessId: string) =>
    request<{ id: string; businessName: string; businessType: string; employeeCount: number; locationCount: number; businessHours: string; yearsOperating: number }>(
      orgId, `/businesses/${businessId}`
    ),

  createBusiness: (orgId: string, input: Record<string, unknown>) =>
    request<{ business: { id: string; name: string } }>(orgId, "/businesses", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getMissionControlSnapshot: (orgId: string, businessId: string) =>
    request<{
      workflows: Array<{ id: string; workflowKey: string; state: string }>;
      deadLetters: unknown[];
      timeline: Array<{ id: string; type: string; description: string; occurredAt: string }>;
    }>(orgId, `/businesses/${businessId}/mission-control`),

  getWorkspace: (orgId: string, businessId: string) =>
    request<{
      businessId: string;
      workspaceKey: string;
      health: { overallScore: number; generatedAt: string } | null;
      kpis: { readings: Array<{ kpiKey: string; label: string; value: number | null; unit: string }> };
      decisions: {
        pending: Array<{ id: string; objective: string; status: string; confidenceScore: number }>;
        approved: Array<{ id: string; objective: string; status: string }>;
        recentlyCompleted: Array<{ id: string; objective: string; status: string }>;
      };
      approvalQueue: {
        pendingDecisions: Array<{ id: string; title: string; status: string; confidenceScore: number }>;
        pendingRecommendations: Array<{ id: string; title: string; status: string }>;
        totalPending: number;
      };
      loopStatus: { lastRunAt: string | null; activeConstraints: number; activeRecommendations: number };
      assembledAt: string;
    }>(orgId, `/businesses/${businessId}/workspace`),

  getTimeline: (orgId: string, businessId: string) =>
    request<Array<{ id: string; type: string; description: string; occurredAt: string }>>(
      orgId, `/businesses/${businessId}/timeline`
    ),

  getPendingApprovals: (orgId: string, businessId: string) =>
    request<{
      pendingDecisions: Array<{ id: string; objective: string; status: string; confidenceScore: number }>;
      pendingRecommendations: Array<{ id: string; title: string; status: string }>;
      totalPending: number;
    }>(orgId, `/businesses/${businessId}/approvals`),

  approveDecision: (orgId: string, decisionId: string) =>
    request<{ decision: { id: string; status: string } }>(orgId, `/decisions/${decisionId}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  rejectDecision: (orgId: string, decisionId: string, reason: string) =>
    request<{ decision: { id: string; status: string } }>(orgId, `/decisions/${decisionId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  approveRecommendation: (orgId: string, recommendationId: string) =>
    request<{ id: string; status: string }>(orgId, `/recommendations/${recommendationId}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  dismissRecommendation: (orgId: string, recommendationId: string) =>
    request<{ id: string; status: string }>(orgId, `/recommendations/${recommendationId}/dismiss`, {
      method: "POST",
      body: JSON.stringify({}),
    }),

  listRecommendations: (orgId: string, businessId: string) =>
    request<Array<{
      id: string;
      title: string;
      description: string;
      category: string;
      status: string;
      difficulty: string;
      estimatedEffortHours: number;
      estimatedCost: number;
      estimatedRoi: { profitImpactAnnual: number };
      estimatedTimeToValueDays: number;
      confidence: number;
      relatedKpiKeys: string[];
    }>>(orgId, `/businesses/${businessId}/recommendations`),

  getRecommendationPriorities: (orgId: string, businessId: string) =>
    request<Array<{
      id: string;
      recommendationId: string;
      priority: string;
      rank: number;
    }>>(orgId, `/businesses/${businessId}/recommendations/priorities`),

  startMri: (orgId: string, businessId: string) =>
    request<{ id: string; businessId: string; status: string; version: string; startedAt: string; completedAt: string | null }>(
      orgId, `/businesses/${businessId}/mri`, { method: "POST", body: JSON.stringify({}) }
    ),

  submitMriAnswer: (orgId: string, mriId: string, sectionKey: string, questionKey: string, value: unknown) =>
    request<{ id: string; mriId: string; sectionKey: string; questionKey: string; value: unknown }>(
      orgId, `/mri/${mriId}/answers`, {
        method: "POST",
        body: JSON.stringify({ sectionKey, questionKey, value }),
      }
    ),

  completeMriSection: (orgId: string, mriId: string, sectionKey: string) =>
    request<void>(orgId, `/mri/${mriId}/sections/${sectionKey}/complete`, { method: "POST", body: JSON.stringify({}) }),

  completeMri: (orgId: string, mriId: string) =>
    request<{ id: string; status: string; completedAt: string }>(
      orgId, `/mri/${mriId}/complete`, { method: "POST", body: JSON.stringify({}) }
    ),

  getMriResponses: (orgId: string, mriId: string) =>
    request<Array<{ id: string; sectionKey: string; questionKey: string; value: unknown }>>(
      orgId, `/mri/${mriId}/responses`
    ),

  getKpis: (orgId: string, businessId: string) =>
    request<{ readings: Array<{ kpiKey: string; label: string; value: number | null; unit: string; trend: string | null }>; measuredAt: string }>(
      orgId, `/businesses/${businessId}/kpis`
    ),

  getRootCause: (orgId: string, businessId: string) =>
    request<{
      chains: Array<{ rootCauseKey: string; rootCauseLabel: string; severity: string; affectedKpiKeys: string[]; recommendedActions: string[]; confidence: number }>;
      primaryRootCause: string | null;
      summary: string;
      detectedAt: string;
    }>(orgId, `/businesses/${businessId}/rootcause`),

  getConstraints: (orgId: string, businessId: string) =>
    request<Array<{ id: string; constraintKey: string; status: string; severity: string; description: string }>>(
      orgId, `/businesses/${businessId}/constraints`
    ),

  getDecisions: (orgId: string, businessId: string) =>
    request<Array<{ id: string; objective: string; status: string; confidenceScore: number; decisionType: string }>>(
      orgId, `/businesses/${businessId}/decisions`
    ),

  submitFeedback: (orgId: string, input: { message: string; businessId?: string; pageUrl?: string; category?: string }) =>
    request<{ feedbackId: string; status: string }>(orgId, "/support/feedback", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  submitNps: (orgId: string, input: { businessId: string; score: number; comment?: string }) =>
    request<{ status: string }>(orgId, "/nps", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  validateBetaInvite: (code: string) =>
    fetch(`${API_BASE_URL}/api/v1/beta/invites/${encodeURIComponent(code)}/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }).then((r) => r.json() as Promise<{ valid: boolean; invite: unknown }>),

  getFlags: () =>
    fetch(`${API_BASE_URL}/api/v1/flags`).then((r) => r.json() as Promise<Record<string, boolean>>),

  getIntegrations: (orgId: string, businessId: string) =>
    request<Array<{ providerKey: string; status: string; connectedAt: string | null }>>(
      orgId, `/businesses/${businessId}/integrations`
    ),

  getToolExecutions: (orgId: string, businessId: string) =>
    request<Array<{ id: string; providerKey: string; toolKey: string; status: string; startedAt: string; completedAt: string | null }>>(
      orgId, `/businesses/${businessId}/tools/executions`
    ),

  // Customer OS
  listCustomers: (orgId: string, businessId: string, query?: string) => {
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    return request<Array<{
      id: string; firstName: string; lastName: string;
      email: string | null; phone: string | null; address: string | null;
      status: string; source: string | null; tags: string[];
      totalRevenue: number; healthScore: number | null;
      lastContactAt: string | null; createdAt: string;
    }>>(orgId, `/businesses/${businessId}/customers${qs}`);
  },

  createCustomer: (orgId: string, businessId: string, input: {
    firstName: string; lastName?: string; email?: string | null;
    phone?: string | null; address?: string | null;
    source?: string | null; tags?: string[]; notes?: string | null;
  }) =>
    request<{ id: string; firstName: string; lastName: string }>(orgId, `/businesses/${businessId}/customers`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getCustomer: (orgId: string, businessId: string, customerId: string) =>
    request<{
      id: string; firstName: string; lastName: string;
      email: string | null; phone: string | null; address: string | null;
      status: string; source: string | null; tags: string[]; notes: string | null;
      totalRevenue: number; healthScore: number | null;
      lastContactAt: string | null; createdAt: string;
    }>(orgId, `/businesses/${businessId}/customers/${customerId}`),

  updateCustomer: (orgId: string, businessId: string, customerId: string, patch: Record<string, unknown>) =>
    request<{ id: string }>(orgId, `/businesses/${businessId}/customers/${customerId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  listCustomerInteractions: (orgId: string, businessId: string, customerId: string) =>
    request<Array<{
      id: string; type: string; summary: string;
      metadata: Record<string, unknown>; occurredAt: string;
    }>>(orgId, `/businesses/${businessId}/customers/${customerId}/interactions`),

  addCustomerInteraction: (orgId: string, businessId: string, customerId: string, input: {
    type: string; summary: string; metadata?: Record<string, unknown>;
  }) =>
    request<{ id: string; type: string; summary: string; occurredAt: string }>(
      orgId,
      `/businesses/${businessId}/customers/${customerId}/interactions`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  // Marketplace
  getMarketplacePacks: (orgId: string, query?: string, category?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category) params.set("category", category);
    const qs = params.toString();
    return request<Array<{
      key: string; name: string; description: string; version: string;
      category: string; industries: string[]; kpiCount: number;
      workflowCount: number; aiEmployeeCount: number; decisionCount: number;
      constraintCount: number; playbookCount: number; featured: boolean; comingSoon: boolean;
    }>>(orgId, `/marketplace/packs${qs ? `?${qs}` : ""}`);
  },

  getInstalledPacks: (orgId: string) =>
    request<Array<{ packKey: string; orgId: string; installedAt: string; version: string }>>(
      orgId, "/marketplace/installed"
    ),

  installPack: (orgId: string, packKey: string) =>
    request<{ packKey: string; orgId: string; installedAt: string; version: string }>(
      orgId, `/marketplace/packs/${encodeURIComponent(packKey)}/install`, { method: "POST", body: JSON.stringify({}) }
    ),

  uninstallPack: (orgId: string, packKey: string) =>
    request<{ status: string }>(
      orgId, `/marketplace/packs/${encodeURIComponent(packKey)}/install`, { method: "DELETE" }
    ),

  // Workflow executions
  listWorkflowExecutions: (orgId: string, businessId: string, status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request<Array<{
      id: string;
      workflowKey: string;
      workflowName: string;
      status: string;
      startedAt: string;
      completedAt: string | null;
      durationMs: number | null;
      errorMessage: string | null;
    }>>(orgId, `/businesses/${businessId}/workflows/executions${qs}`);
  },

  getWorkflowExecution: (orgId: string, businessId: string, executionId: string) =>
    request<{
      id: string;
      workflowKey: string;
      workflowName: string;
      status: string;
      startedAt: string;
      completedAt: string | null;
      durationMs: number | null;
      errorMessage: string | null;
      steps: Array<{
        stepKey: string;
        taskType: string;
        status: string;
        startedAt: string | null;
        completedAt: string | null;
        durationMs: number | null;
        outputSummary: string | null;
        errorMessage: string | null;
      }>;
    }>(orgId, `/businesses/${businessId}/workflows/executions/${executionId}`),

  retryWorkflow: (orgId: string, businessId: string, executionId: string) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/workflows/executions/${executionId}/retry`,
      { method: "POST", body: JSON.stringify({}) }
    ),

  // Scenarios
  listScenarios: (orgId: string, businessId: string) =>
    request<Array<{
      id: string;
      name: string;
      description: string;
      status: string;
      timeHorizonMonths: number;
      priorityFocus: string;
      confidenceScore: number;
      projectedRevenueImpact: number | null;
      riskLevel: string;
      keyAssumptions: string[];
      kpiProjections: Array<{ kpiKey: string; label: string; currentValue: number | null; projectedValue: number | null; unit: string }>;
      createdAt: string;
    }>>(orgId, `/businesses/${businessId}/scenarios`),

  createScenario: (orgId: string, businessId: string, input: {
    name: string;
    timeHorizonMonths: number;
    priorityFocus: string;
    description?: string;
  }) =>
    request<{ id: string; name: string; status: string }>(
      orgId, `/businesses/${businessId}/scenarios`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  // Org-level business list
  listBusinesses: (orgId: string) =>
    request<Array<{
      id: string;
      businessName: string;
      businessType: string;
      employeeCount: number;
      locationCount: number;
      yearsOperating: number;
      health: { overallScore: number; generatedAt: string } | null;
    }>>(orgId, "/businesses"),

  // Health history for sparkline (last N scores)
  getHealthHistory: (orgId: string, businessId: string) =>
    request<Array<{ score: number; generatedAt: string }>>(
      orgId, `/businesses/${businessId}/health/history`
    ),

  // Jobs
  listJobs: (orgId: string, businessId: string) =>
    request<Array<{
      id: string; title: string; description: string | null;
      status: string; priority: string; customerId: string | null;
      assignedTo: string | null; scheduledAt: string | null;
      startedAt: string | null; completedAt: string | null;
      estimatedDurationMinutes: number | null; location: string | null;
      tags: string[]; createdAt: string;
    }>>(orgId, `/businesses/${businessId}/jobs`),

  createJob: (orgId: string, businessId: string, input: {
    title: string; description?: string | null; customerId?: string | null;
    priority?: string; scheduledAt?: string | null;
    estimatedDurationMinutes?: number | null; location?: string | null;
    assignedTo?: string | null; tags?: string[]; notes?: string | null;
  }) =>
    request<{ id: string; title: string; status: string }>(
      orgId, `/businesses/${businessId}/jobs`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  updateJob: (orgId: string, businessId: string, jobId: string, patch: Record<string, unknown>) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/jobs/${jobId}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    ),

  startJob: (orgId: string, businessId: string, jobId: string) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/jobs/${jobId}/start`,
      { method: "POST", body: JSON.stringify({}) }
    ),

  completeJob: (orgId: string, businessId: string, jobId: string, actualDurationMinutes?: number) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/jobs/${jobId}/complete`,
      { method: "POST", body: JSON.stringify({ actualDurationMinutes }) }
    ),

  deleteJob: (orgId: string, businessId: string, jobId: string) =>
    request<{ deleted: boolean }>(
      orgId, `/businesses/${businessId}/jobs/${jobId}`,
      { method: "DELETE" }
    ),

  // Appointments
  listAppointments: (orgId: string, businessId: string) =>
    request<Array<{
      id: string; title: string; notes: string | null;
      status: string; startAt: string; endAt: string;
      customerId: string | null; jobId: string | null;
      location: string | null; assignedTo: string | null;
      createdAt: string;
    }>>(orgId, `/businesses/${businessId}/appointments`),

  createAppointment: (orgId: string, businessId: string, input: {
    title: string; startAt: string; endAt: string;
    customerId?: string | null; jobId?: string | null;
    notes?: string | null; location?: string | null; assignedTo?: string | null;
  }) =>
    request<{ id: string; title: string; status: string }>(
      orgId, `/businesses/${businessId}/appointments`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  updateAppointment: (orgId: string, businessId: string, appointmentId: string, patch: Record<string, unknown>) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/appointments/${appointmentId}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    ),

  confirmAppointment: (orgId: string, businessId: string, appointmentId: string) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/appointments/${appointmentId}/confirm`,
      { method: "POST", body: JSON.stringify({}) }
    ),

  cancelAppointment: (orgId: string, businessId: string, appointmentId: string) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/appointments/${appointmentId}/cancel`,
      { method: "POST", body: JSON.stringify({}) }
    ),

  // Invoices
  listInvoices: (orgId: string, businessId: string) =>
    request<Array<{
      id: string; invoiceNumber: string; customerId: string; jobId: string | null;
      status: string; subtotalCents: number; taxCents: number; discountCents: number;
      totalCents: number; currency: string; dueAt: string | null;
      sentAt: string | null; paidAt: string | null; createdAt: string;
    }>>(orgId, `/businesses/${businessId}/invoices`),

  createInvoice: (orgId: string, businessId: string, input: {
    customerId: string; jobId?: string | null;
    lineItems: Array<{ description: string; quantity: number; unitPriceCents: number }>;
    taxCents?: number; discountCents?: number; currency?: string;
    dueAt?: string | null; notes?: string | null; terms?: string | null;
  }) =>
    request<{ id: string; invoiceNumber: string; status: string }>(
      orgId, `/businesses/${businessId}/invoices`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  updateInvoice: (orgId: string, businessId: string, invoiceId: string, patch: Record<string, unknown>) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/invoices/${invoiceId}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    ),

  sendInvoice: (orgId: string, businessId: string, invoiceId: string) =>
    request<{ id: string; status: string; sentAt: string }>(
      orgId, `/businesses/${businessId}/invoices/${invoiceId}/send`,
      { method: "POST", body: JSON.stringify({}) }
    ),

  markInvoicePaid: (orgId: string, businessId: string, invoiceId: string, paymentMethod?: string) =>
    request<{ id: string; status: string; paidAt: string }>(
      orgId, `/businesses/${businessId}/invoices/${invoiceId}/mark-paid`,
      { method: "POST", body: JSON.stringify({ paymentMethod }) }
    ),

  // Payments
  listPayments: (orgId: string, businessId: string) =>
    request<Array<{
      id: string; customerId: string; invoiceId: string;
      amountCents: number; currency: string; method: string; status: string;
      reference: string | null; notes: string | null; paidAt: string | null; createdAt: string;
    }>>(orgId, `/businesses/${businessId}/payments`),

  createPayment: (orgId: string, businessId: string, input: {
    customerId: string; invoiceId: string; amountCents: number;
    method: string; currency?: string; reference?: string | null;
    notes?: string | null; paidAt?: string | null;
  }) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/payments`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  updatePaymentStatus: (orgId: string, businessId: string, paymentId: string, status: string) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/payments/${paymentId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    ),

  // Reviews
  listReviews: (orgId: string, businessId: string) =>
    request<Array<{
      id: string; customerId: string; jobId: string | null; rating: number;
      title: string | null; body: string | null; status: string; source: string;
      response: string | null; respondedAt: string | null; createdAt: string;
    }>>(orgId, `/businesses/${businessId}/reviews`),

  createReview: (orgId: string, businessId: string, input: {
    customerId: string; rating: number; jobId?: string | null;
    title?: string | null; body?: string | null; source?: string;
  }) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/reviews`,
      { method: "POST", body: JSON.stringify(input) }
    ),

  respondToReview: (orgId: string, businessId: string, reviewId: string, response: string) =>
    request<{ id: string; response: string | null }>(
      orgId, `/businesses/${businessId}/reviews/${reviewId}/respond`,
      { method: "PATCH", body: JSON.stringify({ response }) }
    ),

  updateReviewStatus: (orgId: string, businessId: string, reviewId: string, status: string) =>
    request<{ id: string; status: string }>(
      orgId, `/businesses/${businessId}/reviews/${reviewId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    ),

  // Analytics
  getBusinessAnalytics: (orgId: string, businessId: string) =>
    request<{
      revenue: { totalCents: number; paidCents: number; pendingCents: number; overdueCount: number; monthlyTrend: Array<{ month: string; amountCents: number }> };
      jobs: { total: number; completed: number; inProgress: number; completionRate: number; avgDurationMinutes: number | null };
      appointments: { total: number; upcoming: number; noShowRate: number };
      customers: { total: number; newThisMonth: number; withOpenInvoices: number };
      reviews: { averageRating: number; total: number; responseRate: number };
      payments: { totalReceivedCents: number; avgDaysToPay: number | null };
    }>(orgId, `/businesses/${businessId}/analytics`),

  // Org-level dashboard summary
  getOrgDashboard: (orgId: string) =>
    request<{
      businessCount: number;
      healthDistribution: { excellent: number; good: number; needsAttention: number; critical: number };
      topAlerts: Array<{ businessId: string; businessName: string; healthScore: number }>;
      recentDecisions: Array<{ id: string; businessId: string; businessName: string; objective: string; status: string; createdAt: string }>;
      pendingApprovalsCount: number;
      revenueAtRisk: number;
    }>(orgId, "/dashboard"),
};
