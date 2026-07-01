import { requireBrowserIdentity } from "../../src/server/auth";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { identity } = await requireBrowserIdentity("/dashboard");

  return (
    <>
      <header className="app-header">
        <a className="brand-link" href="/dashboard">BOSS</a>
        <div className="account-actions">
          <span>{identity.email}</span>
          <form action="/api/auth/sign-out" method="post">
            <button className="quiet-button" type="submit">Sign out</button>
          </form>
        </div>
      </header>
      {children}
    </>
  );
}
