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

async function request<T>(orgId: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-org-id": orgId,
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
};
