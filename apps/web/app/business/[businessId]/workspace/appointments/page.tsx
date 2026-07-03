import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { AppointmentsClient } from "./AppointmentsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function AppointmentsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let appointments: Awaited<ReturnType<typeof apiClient.listAppointments>> = [];
  let error: string | null = null;

  try {
    appointments = await apiClient.listAppointments(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load appointments";
  }

  return <AppointmentsClient orgId={orgId} businessId={businessId} appointments={appointments} error={error} />;
}
