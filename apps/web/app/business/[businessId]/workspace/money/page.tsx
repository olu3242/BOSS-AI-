import Link from "next/link";
import { PageHeader } from "../../../../../src/components/ui/PageHeader";
import { Card } from "../../../../../src/components/ui/Card";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function MoneyPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Money" description="Estimates, invoices, payments, and cash flow." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Invoices",   desc: "Create and track invoices",        icon: "🧾" },
          { label: "Estimates",  desc: "Send quotes and win more jobs",     icon: "💰" },
          { label: "Cash Flow",  desc: "Understand your financial health",  icon: "📊" },
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
        <p className="text-sm text-text-muted">Revenue OS is part of the RC2.1 Business Operating Capabilities rollout.</p>
        <Link href={base} className="mt-3 inline-flex text-sm text-text-secondary hover:text-text-primary transition-colors">
          ← Back to Command Center
        </Link>
      </Card>
    </div>
  );
}
