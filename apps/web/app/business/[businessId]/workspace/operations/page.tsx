import Link from "next/link";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function OperationsPage({ params }: Props) {
  const { businessId } = await params;
  const base = `/business/${businessId}/workspace`;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">Business Domain</p>
        <h1 className="mt-1 font-display text-3xl">Operations</h1>
        <p className="mt-2 text-sm text-neutral-400">Team, workflows, automation, and knowledge base.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Team",        desc: "Staff, roles, and time tracking",  icon: "👥" },
          { label: "Automation",  desc: "Trigger workflows automatically",  icon: "⚙️" },
          { label: "Knowledge",   desc: "SOPs, docs, and AI search",        icon: "📚" },
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
        <p className="text-sm text-neutral-500">Workforce OS and Automation OS are part of the RC2.1 Business Operating Capabilities rollout.</p>
        <Link href={base} className="mt-3 inline-flex text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
          ← Back to Command Center
        </Link>
      </div>
    </div>
  );
}
