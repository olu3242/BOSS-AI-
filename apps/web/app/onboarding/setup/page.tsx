import { requireActiveTenant } from "../../../src/server/auth";
import { OnboardingSetupClient } from "./OnboardingSetupClient";

export default async function OnboardingSetupPage() {
  const { organization } = await requireActiveTenant("/auth/sign-in");
  return <OnboardingSetupClient orgId={organization.id} />;
}
