// Seeds the worked example from the design doc. Illustrative only: no real research or results.
// Baselines and targets are deliberately left blank.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const TITLE = "One-tap reorder (example)";

async function main() {
  await db.feature.deleteMany({ where: { isExample: true } });

  const f = await db.feature.create({
    data: {
      title: TITLE,
      isExample: true,
      request: "We want one-tap reorder to increase repeat purchases.",
      outcome: "Customers who already ordered come back and complete another order with less effort.",
    },
  });

  const request = await db.source.create({
    data: { featureId: f.id, title: "Original request", origin: "Pasted when the feature was created", content: f.request },
  });

  const assumption = await db.assumption.create({
    data: {
      featureId: f.id,
      statement: "Easier reordering increases repeat purchases.",
      whyItMatters: "If friction isn't the barrier, the feature won't change repeat behaviour.",
      proposedTest: "Compare completed repeat orders between exposed and holdout customers in the eligible cohort.",
      evidenceNeeded: "A difference in completed repeat orders that the evaluation design can attribute to the feature.",
      sources: { create: [{ sourceId: request.id }] },
    },
  });

  await db.question.createMany({
    data: [
      { featureId: f.id, text: "Which customers are expected to repeat, and what evidence explains their current behaviour?", assignedRole: "pm" },
      { featureId: f.id, text: "Is ordering friction a meaningful barrier?", assignedRole: "growth" },
      { featureId: f.id, text: "What happens when an item is unavailable, has changed price or has a different variant?", assignedRole: "design" },
      { featureId: f.id, text: "Does the customer review the basket before committing?", assignedRole: "design" },
      { featureId: f.id, text: "What event data and baseline are available?", assignedRole: "engineering" },
    ],
  });

  await db.scopeItem.createMany({
    data: [
      { featureId: f.id, text: "Rebuild a previous basket using current availability and prices", inScope: true },
      { featureId: f.id, text: "Customer reviews the rebuilt basket before checkout", inScope: true },
      { featureId: f.id, text: "Scheduled or automatic repeat orders", inScope: false },
    ],
  });

  await db.measure.createMany({
    data: [
      { featureId: f.id, kind: "success", metric: "Completed repeat orders among the eligible cohort", missingInstrumentation: "Confirm a reorder-started event exists" },
      { featureId: f.id, kind: "guardrail", metric: "Order cancellations" },
      { featureId: f.id, kind: "guardrail", metric: "Refunds" },
      { featureId: f.id, kind: "guardrail", metric: "Support contacts about orders" },
    ],
  });

  await db.historyEntry.create({
    data: { featureId: f.id, entity: "feature", entityId: f.id, action: "created", detail: "Seeded example" },
  });

  console.log(`Seeded "${TITLE}"`);
}

main().finally(() => db.$disconnect());
