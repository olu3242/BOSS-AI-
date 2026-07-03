import { apiClient, ApiClientError } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";
import { InvoicesClient } from "./InvoicesClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function InvoicesPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let invoices: Awaited<ReturnType<typeof apiClient.listInvoices>> = [];
  let error: string | null = null;

  try {
    invoices = await apiClient.listInvoices(orgId, businessId);
  } catch (err) {
    error = err instanceof ApiClientError ? err.body.message : "Failed to load invoices";
  }

  return <InvoicesClient orgId={orgId} businessId={businessId} invoices={invoices} error={error} />;
}
