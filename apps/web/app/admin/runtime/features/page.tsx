import { requireActiveTenant } from "../../../../src/server/auth";
import { RuntimeFeaturesClient } from "./RuntimeFeaturesClient";

export default async function RuntimeFeaturesPage() {
  // Admin gate — tenant must be active
  await requireActiveTenant("/auth/sign-in");
  return <RuntimeFeaturesClient />;
}
