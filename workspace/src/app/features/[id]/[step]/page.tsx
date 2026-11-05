import { notFound } from "next/navigation";
import { findStep } from "@/lib/domain";
import { getFeature } from "@/lib/queries";
import { ContextStep } from "@/components/steps/ContextStep";
import { ClarifyStep } from "@/components/steps/ClarifyStep";
import { EvidenceStep } from "@/components/steps/EvidenceStep";
import { ScopeStep } from "@/components/steps/ScopeStep";
import { LearningStep } from "@/components/steps/LearningStep";
import { ReviewStep } from "@/components/steps/ReviewStep";
import { ShareStep } from "@/components/steps/ShareStep";

export const dynamic = "force-dynamic";

const views = {
  context: ContextStep,
  clarify: ClarifyStep,
  evidence: EvidenceStep,
  scope: ScopeStep,
  learning: LearningStep,
  review: ReviewStep,
  share: ShareStep,
};

export default async function StepPage({ params }: { params: Promise<{ id: string; step: string }> }) {
  const { id, step } = await params;
  const meta = findStep(step);
  if (!meta) notFound();
  const data = await getFeature(id);
  const View = views[meta.slug];
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="eyebrow">Step {meta.n} of 7</p>
        <h2 className="mt-1 text-2xl font-bold">{meta.title}</h2>
      </div>
      <View data={data} />
    </div>
  );
}
