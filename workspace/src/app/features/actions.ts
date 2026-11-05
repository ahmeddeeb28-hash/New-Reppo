"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { db, type Tx } from "@/lib/db";
import { sectionHasContent, type SectionKey } from "@/lib/domain";
import { logHistory, reopenIfAgreed } from "@/lib/history";
import { formToObject, schemas } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

function parse<S extends z.ZodTypeAny>(schema: S, fd: FormData): z.infer<S> {
  const r = schema.safeParse(formToObject(fd));
  if (!r.success) {
    const first = r.error.issues[0];
    throw new Error(`${first.path.join(".") || "Form"}: ${first.message}`);
  }
  return r.data;
}

function refresh(featureId: string) {
  revalidatePath(`/features/${featureId}`, "layout");
  revalidatePath("/");
}

/** Run a content change inside a transaction and reopen the section if it was agreed. */
async function change(featureId: string, section: SectionKey, fn: (tx: Tx) => Promise<unknown>) {
  await db.$transaction(async (tx) => {
    await fn(tx);
    await reopenIfAgreed(tx, featureId, section);
  });
  refresh(featureId);
}

// ---------- Feature ----------

export async function createFeature(fd: FormData) {
  const data = parse(schemas.createFeature, fd);
  const feature = await db.$transaction(async (tx) => {
    const f = await tx.feature.create({ data });
    // The pasted idea becomes the first source, so later claims can cite it.
    await tx.source.create({
      data: { featureId: f.id, title: "Original request", origin: "Pasted when the feature was created", kind: "text", content: data.request },
    });
    await logHistory(tx, { featureId: f.id, entity: "feature", entityId: f.id, action: "created", detail: data.title });
    return f;
  });
  revalidatePath("/");
  redirect(`/features/${feature.id}/context`);
}

export async function renameFeature(fd: FormData) {
  const { featureId, title } = parse(schemas.renameFeature, fd);
  await db.feature.update({ where: { id: featureId }, data: { title } });
  refresh(featureId);
}

export async function deleteFeature(fd: FormData) {
  const featureId = String(fd.get("featureId") ?? "");
  if (!featureId) throw new Error("Missing feature");
  await db.feature.delete({ where: { id: featureId } });
  revalidatePath("/");
  redirect("/");
}

// ---------- Text sections ----------

export async function saveProblem(fd: FormData) {
  const { featureId, ...data } = parse(schemas.problem, fd);
  await change(featureId, "problem", (tx) => tx.feature.update({ where: { id: featureId }, data }));
}

export async function saveAudience(fd: FormData) {
  const { featureId, ...data } = parse(schemas.audience, fd);
  await change(featureId, "audience", (tx) => tx.feature.update({ where: { id: featureId }, data }));
}

export async function saveOutcome(fd: FormData) {
  const { featureId, ...data } = parse(schemas.outcome, fd);
  await change(featureId, "outcome", (tx) => tx.feature.update({ where: { id: featureId }, data }));
}

// ---------- Section status ----------

export async function setSectionStatus(fd: FormData) {
  const { featureId, section, status } = parse(schemas.sectionStatus, fd);
  const key = section as SectionKey;
  await db.$transaction(async (tx) => {
    if (status === "agreed") {
      const f = await tx.feature.findUniqueOrThrow({
        where: { id: featureId },
        include: { sources: true, assumptions: true, questions: true, scopeItems: true, alternatives: true, criteria: true, measures: true, decisions: true },
      });
      if (!sectionHasContent(f, key)) throw new Error("An empty section can't be agreed");
    }
    await tx.sectionState.upsert({
      where: { featureId_section: { featureId, section } },
      create: { featureId, section, status },
      update: { status },
    });
    await logHistory(tx, { featureId, entity: "section", entityId: section, action: status === "agreed" ? "agreed" : "reopened" });
  });
  refresh(featureId);
}

// ---------- Sources (evidence) ----------

export async function addSource(fd: FormData) {
  const { featureId, ...data } = parse(schemas.addSource, fd);
  await change(featureId, "evidence", (tx) => tx.source.create({ data: { featureId, ...data } }));
}

export async function removeSource(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "evidence", (tx) => tx.source.delete({ where: { id, featureId } }));
}

// ---------- Scope, alternatives, criteria ----------

export async function addScopeItem(fd: FormData) {
  const { featureId, text, inScope } = parse(schemas.addScope, fd);
  await change(featureId, "scope", async (tx) => {
    const item = await tx.scopeItem.create({ data: { featureId, text, inScope: inScope === "in" } });
    await logHistory(tx, { featureId, entity: "scope", entityId: item.id, action: inScope === "in" ? "added to scope" : "excluded from scope", detail: text });
  });
}

export async function toggleScopeItem(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "scope", async (tx) => {
    const item = await tx.scopeItem.findUniqueOrThrow({ where: { id, featureId } });
    await tx.scopeItem.update({ where: { id }, data: { inScope: !item.inScope } });
    await logHistory(tx, { featureId, entity: "scope", entityId: id, action: item.inScope ? "moved out of scope" : "moved into scope", detail: item.text });
  });
}

export async function removeScopeItem(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "scope", async (tx) => {
    const item = await tx.scopeItem.delete({ where: { id, featureId } });
    await logHistory(tx, { featureId, entity: "scope", entityId: id, action: "removed", detail: item.text });
  });
}

export async function addAlternative(fd: FormData) {
  const { featureId, ...data } = parse(schemas.addAlternative, fd);
  await change(featureId, "alternatives", (tx) => tx.alternative.create({ data: { featureId, ...data } }));
}

export async function removeAlternative(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "alternatives", (tx) => tx.alternative.delete({ where: { id, featureId } }));
}

export async function addCriterion(fd: FormData) {
  const { featureId, text } = parse(schemas.addCriterion, fd);
  await change(featureId, "acceptance_criteria", (tx) => tx.acceptanceCriterion.create({ data: { featureId, text } }));
}

export async function removeCriterion(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "acceptance_criteria", (tx) => tx.acceptanceCriterion.delete({ where: { id, featureId } }));
}

// ---------- Assumptions ----------

export async function addAssumption(fd: FormData) {
  const { featureId, sourceIds, ...data } = parse(schemas.assumption, fd);
  await change(featureId, "assumptions", async (tx) => {
    const a = await tx.assumption.create({
      data: { featureId, ...data, sources: { create: sourceIds.map((sourceId) => ({ sourceId })) } },
    });
    await logHistory(tx, { featureId, entity: "assumption", entityId: a.id, action: "registered", detail: `${a.statement} (${a.status})` });
  });
}

export async function updateAssumption(fd: FormData) {
  const assumptionId = String(fd.get("id") ?? "");
  const { featureId, sourceIds, ...data } = parse(schemas.assumption, fd);
  await change(featureId, "assumptions", async (tx) => {
    const before = await tx.assumption.findUniqueOrThrow({ where: { id: assumptionId, featureId } });
    await tx.assumption.update({
      where: { id: assumptionId },
      data: { ...data, sources: { deleteMany: {}, create: sourceIds.map((sourceId) => ({ sourceId })) } },
    });
    if (before.status !== data.status) {
      await logHistory(tx, { featureId, entity: "assumption", entityId: assumptionId, action: `status ${before.status} → ${data.status}`, detail: data.statement });
    }
  });
}

export async function removeAssumption(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "assumptions", async (tx) => {
    const a = await tx.assumption.delete({ where: { id, featureId } });
    await logHistory(tx, { featureId, entity: "assumption", entityId: id, action: "removed", detail: a.statement });
  });
}

// ---------- Questions ----------

export async function addQuestion(fd: FormData) {
  const { featureId, ...data } = parse(schemas.question, fd);
  await change(featureId, "open_questions", (tx) => tx.question.create({ data: { featureId, ...data } }));
}

export async function answerQuestion(fd: FormData) {
  const obj = formToObject(fd);
  const r = schemas.answerQuestion.safeParse({ ...obj, resolved: obj.resolved === "on" });
  if (!r.success) throw new Error(r.error.issues[0].message);
  const { featureId, id, answer, resolved } = r.data;
  await change(featureId, "open_questions", (tx) => tx.question.update({ where: { id, featureId }, data: { answer, resolved } }));
}

export async function removeQuestion(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "open_questions", (tx) => tx.question.delete({ where: { id, featureId } }));
}

// ---------- Measures ----------

export async function addMeasure(fd: FormData) {
  const { featureId, ...data } = parse(schemas.measure, fd);
  await change(featureId, "measures", (tx) => tx.measure.create({ data: { featureId, ...data } }));
}

export async function updateMeasure(fd: FormData) {
  const measureId = String(fd.get("id") ?? "");
  const { featureId, ...data } = parse(schemas.measure, fd);
  await change(featureId, "measures", (tx) => tx.measure.update({ where: { id: measureId, featureId }, data }));
}

export async function removeMeasure(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "measures", (tx) => tx.measure.delete({ where: { id, featureId } }));
}

// ---------- Decisions ----------

export async function addDecision(fd: FormData) {
  const { featureId, assumptionIds, sourceIds, ...data } = parse(schemas.decision, fd);
  await change(featureId, "decisions", async (tx) => {
    const d = await tx.decision.create({
      data: {
        featureId,
        ...data,
        assumptions: { create: assumptionIds.map((assumptionId) => ({ assumptionId })) },
        sources: { create: sourceIds.map((sourceId) => ({ sourceId })) },
      },
    });
    await logHistory(tx, { featureId, entity: "decision", entityId: d.id, action: "recorded", detail: `${d.what}. Reason: ${d.reason}`, actor: d.decidedBy });
  });
}

export async function withdrawDecision(fd: FormData) {
  const { featureId, id } = parse(schemas.remove, fd);
  await change(featureId, "decisions", async (tx) => {
    const d = await tx.decision.delete({ where: { id, featureId } });
    await logHistory(tx, { featureId, entity: "decision", entityId: id, action: "withdrawn", detail: d.what });
  });
}
