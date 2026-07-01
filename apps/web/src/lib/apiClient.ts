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
 * No real login UI exists yet (TD-030), so the web app exchanges its
 * DEMO_ORG_ID for a signed dev token via the API's non-production
 * /auth/dev-token route rather than sending org_id as a spoofable header.
 */
async function getDevToken(orgId: string): Promise<string> {
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
  const token = await getDevToken(orgId);
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
};
