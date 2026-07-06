import Link from "next/link";
import { NpsWidget } from "../../../../../src/components/NpsWidget";
import { requireActiveTenant } from "../../../../../src/server/auth";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function MriCompletePage({ params }: Props) {
  const { businessId } = await params;
  const { organization } = await requireActiveTenant(`/auth/sign-in`);
  const orgId = organization.id;
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center gap-8 px-6 py-24">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-900/40 text-3xl">
        ✓
      </div>

      <div className="text-center">
        <h1 className="font-display text-3xl text-text-primary">Business MRI complete</h1>
        <p className="mt-3 text-text-muted">
          BOSS has everything it needs to generate your health score, identify constraints, and create your first
          recommendations.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs text-center">
        <Link
          href={`/business/${businessId}/workspace`}
          className="rounded bg-accent px-6 py-3 font-display text-sm text-white"
        >
          View your workspace →
        </Link>
        <p className="text-xs text-text-muted">
          Your health score and first recommendations are being generated.
        </p>
      </div>

      <div className="w-full max-w-lg">
        <NpsWidget businessId={businessId} orgId={orgId} context="BOSS" />
      </div>
    </main>
  );
}
