import { requireActiveTenant } from "../../src/server/auth";
import { MarketplaceClient } from "./MarketplaceClient";

export default async function MarketplacePage() {
  const { organization } = await requireActiveTenant("/auth/sign-in");
  return <MarketplaceClient orgId={organization.id} />;
}
