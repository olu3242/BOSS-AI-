import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { PaymentsClient } from "./PaymentsClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function PaymentsPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let payments: Awaited<ReturnType<typeof apiClient.listPayments>> = [];
  let invoices: Awaited<ReturnType<typeof apiClient.listInvoices>> = [];
  let error: string | null = null;

  try {
    [payments, invoices] = await Promise.all([
      apiClient.listPayments(orgId, businessId),
      apiClient.listInvoices(orgId, businessId),
    ]);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load payments";
  }

  return <PaymentsClient orgId={orgId} businessId={businessId} payments={payments} invoices={invoices} error={error} />;
}
