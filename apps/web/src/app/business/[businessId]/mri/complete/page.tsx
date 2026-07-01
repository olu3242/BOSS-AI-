import Link from "next/link";
import { NpsWidget } from "../../../../../components/NpsWidget";

interface Props {
  params: { businessId: string };
}

export default function MriCompletePage({ params }: Props) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/40 text-3xl">
        ✓
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl text-white">Business MRI complete</h1>
        <p className="mt-3 text-neutral-400">
          BOSS has everything it needs to generate your health score, identify constraints, and create your first
          recommendations.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs text-center">
        <Link
          href={`/business/${params.businessId}/workspace`}
          className="rounded bg-accent px-6 py-3 font-display text-sm text-white"
        >
          View your workspace →
        </Link>
        <p className="text-xs text-neutral-600">
          Your health score and first recommendations are being generated.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <NpsWidget businessId={params.businessId} context="BOSS" />
      </div>
    </main>
  );
}
