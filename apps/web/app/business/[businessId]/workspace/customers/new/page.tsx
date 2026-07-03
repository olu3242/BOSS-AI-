import { requireActiveTenant } from "../../../../../../src/server/auth";
import { NewCustomerClient } from "./NewCustomerClient";

export default async function NewCustomerPage() {
  const { organization } = await requireActiveTenant("/auth/sign-in");
  return <NewCustomerClient orgId={organization.id} />;
}
