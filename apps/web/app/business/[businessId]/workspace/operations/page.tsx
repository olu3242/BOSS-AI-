import Link from "next/link";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function OperationsPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  return (
    <div className="flex flex-col gap-8">
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
