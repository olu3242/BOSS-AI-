import { createDemoCommandCenter } from "../../src/demoCommandCenter";
import { requireActiveTenant } from "../../src/server/auth";

export default async function CommandCenterPage() {
  const [{ organization, organizations }, { snapshot }] = await Promise.all([
    requireActiveTenant("/dashboard"),
    createDemoCommandCenter(),
  ]);

  return (
    <main>
      <header className="page-header dashboard-heading">
        <div>
          <p className="eyebrow">BOSS Command Center</p>
          <h1>{organization.name}</h1>
          <p className="subtle">Authenticated organization workspace</p>
        </div>
        <form action="/api/organizations/switch" method="post">
          <label>
            Active organization
            <select defaultValue={organization.id} name="orgId">
              {organizations.map((entry) => (
                <option key={entry.organization.id} value={entry.organization.id}>
                  {entry.organization.name}
                </option>
              ))}
            </select>
          </label>
          <button className="quiet-button" type="submit">Switch</button>
        </form>
      </header>

      <p className="demo-notice">
        Wave A secures this dashboard. Operational metrics remain demonstration
        data until the discovery journey is certified in Wave B.
      </p>

      <section aria-labelledby="metrics-title">
        <h2 id="metrics-title">Executive KPIs</h2>
        <div className="grid metrics">
          {snapshot.metrics.map((metric) => (
            <article className={`card tone-${metric.tone}`} key={metric.label}>
              <span className="label">{metric.label}</span>
              <strong className="metric-value">{metric.value}</strong>
              <p className="detail">{metric.detail}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="grid two" aria-label="Operations">
        <DashboardPanel title="Alerts">
          {snapshot.alerts.map((alert) => (
            <article className={`card tone-${alert.severity}`} key={alert.title}>
              <div className="row"><strong>{alert.title}</strong><span className="pill">{alert.severity}</span></div>
              <p className="detail">{alert.message}</p>
            </article>
          ))}
        </DashboardPanel>
        <DashboardPanel title="AI Agent Status">
          {snapshot.agents.map((agent) => (
            <article className="card" key={agent.name}>
              <div className="row"><strong>{agent.name}</strong><span className="pill">{agent.status.replaceAll("_", " ")}</span></div>
              <p className="detail">{agent.focus}</p>
            </article>
          ))}
        </DashboardPanel>
      </section>
    </main>
  );
}

function DashboardPanel({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return <div><h2>{title}</h2><div className="grid">{children}</div></div>;
}
