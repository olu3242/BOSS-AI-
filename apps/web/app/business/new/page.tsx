import { requireActiveTenant } from "../../../src/server/auth";
import { NewBusinessClient } from "./NewBusinessClient";

export default async function NewBusinessPage() {
  const { organization } = await requireActiveTenant("/auth/sign-in");
  return <NewBusinessClient orgId={organization.id} />;
}
