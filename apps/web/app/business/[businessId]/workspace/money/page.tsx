import Link from "next/link";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function MoneyPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Business Domain</p>
        <h1 className="mt-1 font-display text-3xl">Money</h1>
        <p className="mt-2 text-sm text-neutral-400">Estimates, invoices, payments, and cash flow.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Invoices",   desc: "Create and track invoices",        icon: "🧾" },
          { label: "Estimates",  desc: "Send quotes and win more jobs",     icon: "💰" },
          { label: "Cash Flow",  desc: "Understand your financial health",  icon: "📊" },
        ].map((tile) => (
          <div key={tile.label} className="rounded border border-neutral-800 bg-neutral-900 p-5">
            <span className="text-2xl">{tile.icon}</span>
            <p className="mt-3 font-medium text-neutral-200">{tile.label}</p>
            <p className="mt-1 text-sm text-neutral-500">{tile.desc}</p>
            <p className="mt-4 text-xs text-neutral-600 uppercase tracking-wide">Coming in RC2.1</p>
          </div>
        ))}
      </div>

      <div className="rounded border border-neutral-800 bg-neutral-900/50 p-6 text-center">
        <p className="text-sm text-neutral-500">Revenue OS is part of the RC2.1 Business Operating Capabilities rollout.</p>
        <Link href={base} className="mt-3 inline-flex text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
          ← Back to Command Center
        </Link>
      </div>
    </div>
  );
}
