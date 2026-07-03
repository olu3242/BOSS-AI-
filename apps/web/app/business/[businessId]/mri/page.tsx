import { requireActiveTenant } from "../../../../src/server/auth";
import { MriClient } from "./MriClient";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function MriPage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant("/auth/sign-in");
  return <MriClient businessId={businessId} orgId={organization.id} />;
}
