import { notFound } from "next/navigation";
import { db } from "./db";
import { progress, sectionStatuses, STEPS, stepStatus } from "./domain";

export async function getFeature(id: string) {
  const feature = await db.feature.findUnique({
    where: { id },
    include: {
      sections: true,
      sources: { orderBy: { createdAt: "asc" } },
      scopeItems: { orderBy: { createdAt: "asc" } },
      alternatives: { orderBy: { createdAt: "asc" } },
      assumptions: { orderBy: { createdAt: "asc" }, include: { sources: true } },
      questions: { orderBy: { createdAt: "asc" } },
      decisions: { orderBy: { decidedAt: "desc" }, include: { assumptions: true, sources: true } },
      measures: { orderBy: { createdAt: "asc" } },
      criteria: { orderBy: { createdAt: "asc" } },
      history: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!feature) notFound();
  const statuses = sectionStatuses(feature, feature.sections);
  const steps = STEPS.map((s) => ({
    slug: s.slug,
    n: s.n,
    title: s.title,
    status: stepStatus(s.sections.map((k) => statuses[k])),
  }));
  return { feature, statuses, steps, progress: progress(statuses) };
}

export type LoadedFeature = Awaited<ReturnType<typeof getFeature>>;
export type FeatureRecord = LoadedFeature["feature"];
