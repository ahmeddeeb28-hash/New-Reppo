import Link from "next/link";
import { getFeature } from "@/lib/queries";
import { StepNav } from "./StepNav";

export const dynamic = "force-dynamic";

export default async function FeatureLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { feature, steps, progress } = await getFeature(id);
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Link href="/" className="btn-quiet -ml-1.5">← All features</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">{feature.title}</h1>
          {feature.isExample && <p className="mt-1 text-sm text-question">Example feature for illustration. It contains no real research or results.</p>}
        </div>
        <p className="font-mono text-xs tabular-nums text-muted">
          {progress.agreed} agreed · {progress.proposed} proposed · {progress.empty} empty
        </p>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <StepNav featureId={feature.id} steps={steps} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
