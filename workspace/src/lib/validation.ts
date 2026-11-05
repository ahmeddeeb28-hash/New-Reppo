import { z } from "zod";
import { ASSUMPTION_STATUSES, MEASURE_KINDS, ROLES, SECTION_KEYS, SOURCE_KINDS, STORED_STATUSES } from "./domain";

const req = (max = 2000) => z.string().trim().min(1, "Required").max(max);
const opt = (max = 4000) => z.string().trim().max(max).default("");
const id = z.string().min(1);

export const schemas = {
  createFeature: z.object({ title: req(140), request: req(4000) }),
  renameFeature: z.object({ featureId: id, title: req(140) }),
  problem: z.object({ featureId: id, problem: opt(), constraints: opt() }),
  audience: z.object({ featureId: id, audience: opt(), currentBehaviour: opt() }),
  outcome: z.object({ featureId: id, outcome: opt() }),
  sectionStatus: z.object({ featureId: id, section: z.enum(SECTION_KEYS as [string, ...string[]]), status: z.enum(STORED_STATUSES) }),
  addSource: z.object({ featureId: id, title: req(200), origin: opt(300), kind: z.enum(SOURCE_KINDS), content: opt(20000) }),
  addScope: z.object({ featureId: id, text: req(500), inScope: z.enum(["in", "out"]) }),
  addAlternative: z.object({ featureId: id, description: req(1000), whyNotChosen: opt(1000) }),
  addCriterion: z.object({ featureId: id, text: req(1000) }),
  assumption: z.object({
    featureId: id,
    statement: req(500),
    whyItMatters: opt(1000),
    owner: opt(120),
    proposedTest: opt(1000),
    evidenceNeeded: opt(1000),
    status: z.enum(ASSUMPTION_STATUSES).default("untested"),
    sourceIds: z.array(z.string()).default([]),
  }),
  question: z.object({ featureId: id, text: req(500), assignedRole: z.enum(ROLES), assignee: opt(120) }),
  answerQuestion: z.object({ featureId: id, id, answer: opt(2000), resolved: z.boolean() }),
  measure: z.object({
    featureId: id,
    kind: z.enum(MEASURE_KINDS),
    metric: req(300),
    baseline: opt(200),
    target: opt(200),
    cohort: opt(300),
    window: opt(200),
    missingInstrumentation: opt(1000),
  }),
  decision: z.object({
    featureId: id,
    what: req(500),
    reason: req(1000),
    decidedBy: req(120),
    assumptionIds: z.array(z.string()).default([]),
    sourceIds: z.array(z.string()).default([]),
  }),
  remove: z.object({ featureId: id, id }),
};

/** Turn FormData into a plain object; repeated keys ending in "Ids" become arrays. */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of new Set(fd.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const all = fd.getAll(key).filter((v): v is string => typeof v === "string");
    out[key] = key.endsWith("Ids") ? all : all[0];
  }
  return out;
}
