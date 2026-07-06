import Link from "next/link";
import { apiClient } from "../../../../../src/lib/apiClient";
import { requireActiveTenant } from "../../../../../src/server/auth";

import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function OperationsPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;

  let workflowCount = 0;
  let aiEmployeeCount = 0;
  try {
    const [executions, employees] = await Promise.all([
      apiClient.listWorkflowExecutions(orgId, businessId),
      apiClient.listAiEmployees(orgId),
    ]);
    workflowCount = executions.length;
    aiEmployeeCount = employees.filter((e) => e.lifecycle === "available").length;
  } catch (err) {
    void err;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Business Domain</p>
        <h1 className="mt-1 font-display text-3xl">Operations</h1>
        <p className="mt-2 text-sm text-neutral-400">AI workforce, automation, workflows, and orchestration.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`${base}/workforce`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">🤖</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">AI Workforce</p>
          <p className="mt-1 text-sm text-neutral-500">Manage AI employees and lifecycle</p>
          <p className="mt-3 text-xs text-neutral-600">{aiEmployeeCount} available</p>
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>
        </Link>

        <Link
          href={`${base}/automation`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">⚙️</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">Automation</p>
          <p className="mt-1 text-sm text-neutral-500">Integrations and tool executions</p>
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>
        </Link>

        <Link
          href={`${base}/workflows`}
          className="group rounded border border-neutral-800 bg-neutral-900 p-5 hover:border-neutral-600 transition-colors"
        >
          <span className="text-2xl">🔀</span>
          <p className="mt-3 font-medium text-neutral-200 group-hover:text-white transition-colors">Workflows</p>
          <p className="mt-1 text-sm text-neutral-500">Define and run business workflows</p>
          <p className="mt-3 text-xs text-neutral-600">{workflowCount} executions</p>
          <p className="mt-2 text-xs text-accent font-medium">Open →</p>

      <PageHeader title="Operations" description="Team, workflows, automation, and knowledge base." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Team",        desc: "Staff, roles, and time tracking",  icon: "👥" },
          { label: "Automation",  desc: "Trigger workflows automatically",  icon: "⚙️" },
          { label: "Knowledge",   desc: "SOPs, docs, and AI search",        icon: "📚" },
        ].map((tile) => (
          <Card key={tile.label}>
            <span className="text-2xl">{tile.icon}</span>
            <p className="mt-3 font-medium text-text-primary">{tile.label}</p>
            <p className="mt-1 text-sm text-text-muted">{tile.desc}</p>
            <p className="mt-4 text-xs text-text-muted/60 uppercase tracking-wide">Coming in RC2.1</p>
          </Card>
        ))}
      </div>

      <Card padding="lg" className="text-center">
        <p className="text-sm text-text-muted">Workforce OS and Automation OS are part of the RC2.1 Business Operating Capabilities rollout.</p>
        <Link href={base} className="mt-3 inline-flex text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to Command Center
        </Link>
      </Card>
    </div>
  );
}
