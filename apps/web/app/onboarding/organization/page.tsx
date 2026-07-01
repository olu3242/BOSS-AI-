import { redirect } from "next/navigation";
import {
  createBrowserIdentityServices,
  requireBrowserIdentity,
} from "../../../src/server/auth";

interface OrganizationOnboardingProps {
  readonly searchParams: Promise<{ readonly error?: string }>;
}

export default async function OrganizationOnboarding({
  searchParams,
}: OrganizationOnboardingProps) {
  const query = await searchParams;
  const session = await requireBrowserIdentity("/onboarding/organization");
  const { organizations } = createBrowserIdentityServices();
  if ((await organizations.list(session.identity.userId)).length > 0) {
    redirect("/dashboard");
  }

  return (
    <main className="auth-shell">
      <a className="brand-link" href="/">BOSS</a>
      <section className="auth-panel" aria-labelledby="organization-title">
        <p className="eyebrow">Organization setup</p>
        <h1 id="organization-title">Name your business</h1>
        <p className="subtle">This creates the secure tenant for your team and business data.</p>
        {query.error ? <p className="form-error" role="alert">{query.error}</p> : null}
        <form action="/api/organizations" method="post">
          <label>
            Business name
            <input autoComplete="organization" maxLength={100} minLength={2} name="name" required />
          </label>
          <button type="submit">Create organization</button>
        </form>
      </section>
    </main>
  );
}
