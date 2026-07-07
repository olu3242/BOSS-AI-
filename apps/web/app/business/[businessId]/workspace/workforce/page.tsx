import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { WorkforceClient } from "./WorkforceClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function WorkforcePage({ params }: Props) {
  await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let employees;
  try {
    employees = await apiClient.listAiEmployees(orgId);
  } catch (error) {
    const message = error instanceof ApiClientError ? error.body.message : "Failed to load AI workforce.";
    return (
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">AI Workforce</p>
          <h1 className="mt-1 font-display text-3xl">AI Employees</h1>
        </div>
        <div className="rounded border border-red-800 bg-red-950/30 p-4 text-red-400">
          <p className="font-medium">Failed to load AI workforce</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  const availableCount = employees.filter((e) => e.lifecycle === "available").length;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">AI Workforce</p>
          <h1 className="mt-1 font-display text-3xl">AI Employees</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {availableCount} of {employees.length} employees available — promote or deprecate to manage the workforce.
          </p>
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="rounded border border-neutral-800 bg-neutral-900 p-10 text-center">
          <p className="text-neutral-400">No AI employees are registered.</p>
          <p className="mt-1 text-sm text-neutral-600">Install an industry pack to seed the AI workforce.</p>
        </div>
      ) : (
        <WorkforceClient employees={employees} orgId={orgId} />
      )}
    </div>
  );
}
