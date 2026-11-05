// Domain constants and pure rules. No database access here, so this file is unit-tested.

export const ROLES = ["pm", "design", "growth", "engineering"] as const;
export type Role = (typeof ROLES)[number];
export const ROLE_LABELS: Record<Role, string> = {
  pm: "PM",
  design: "Design",
  growth: "Growth",
  engineering: "Engineering",
};

export const ASSUMPTION_STATUSES = ["untested", "testing", "supported", "refuted"] as const;
export type AssumptionStatus = (typeof ASSUMPTION_STATUSES)[number];

export const MEASURE_KINDS = ["success", "guardrail"] as const;
export type MeasureKind = (typeof MEASURE_KINDS)[number];

export const SOURCE_KINDS = ["text", "link"] as const;

/** Stored statuses. "empty" is derived, never stored. */
export const STORED_STATUSES = ["proposed", "agreed"] as const;
export type StoredStatus = (typeof STORED_STATUSES)[number];
export type SectionStatus = "empty" | StoredStatus;

export const SECTIONS = {
  evidence: { title: "Evidence", hint: "Notes, research and links the definition relies on." },
  problem: { title: "Problem", hint: "Who is affected, how, and the constraints you work within." },
  audience: { title: "Audience", hint: "The target user and what they do today." },
  outcome: { title: "Intended outcome", hint: "The change in behaviour you want to see." },
  assumptions: { title: "Assumptions", hint: "Beliefs the definition rests on. Each needs an owner and a test." },
  open_questions: { title: "Open questions", hint: "What the team still needs to find out, and who answers it." },
  scope: { title: "Scope", hint: "What this release includes and what it leaves out." },
  alternatives: { title: "Alternatives", hint: "Other release boundaries you considered, and why not." },
  acceptance_criteria: { title: "Acceptance criteria", hint: "Testable statements that say when the work is done." },
  measures: { title: "Measures", hint: "Success metric and guardrails. Leave values blank when unknown." },
  decisions: { title: "Decisions", hint: "What was decided, why, by whom, and what it rests on." },
} as const;
export type SectionKey = keyof typeof SECTIONS;
export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

export const STEPS = [
  { slug: "context", n: 1, title: "Add context", sections: ["evidence"] },
  { slug: "clarify", n: 2, title: "Clarify the problem", sections: ["problem", "audience", "outcome"] },
  { slug: "evidence", n: 3, title: "Review evidence", sections: ["assumptions", "open_questions"] },
  { slug: "scope", n: 4, title: "Compare scope", sections: ["scope", "alternatives", "acceptance_criteria"] },
  { slug: "learning", n: 5, title: "Define learning", sections: ["measures"] },
  { slug: "review", n: 6, title: "Review together", sections: ["decisions"] },
  { slug: "share", n: 7, title: "Share the result", sections: [] },
] as const satisfies readonly { slug: string; n: number; title: string; sections: readonly SectionKey[] }[];
export type StepSlug = (typeof STEPS)[number]["slug"];

export function findStep(slug: string) {
  return STEPS.find((s) => s.slug === slug);
}

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/** The shape needed to decide whether each section has content. */
export type FeatureContent = {
  problem: string;
  constraints: string;
  audience: string;
  currentBehaviour: string;
  outcome: string;
  sources: unknown[];
  assumptions: unknown[];
  questions: unknown[];
  scopeItems: unknown[];
  alternatives: unknown[];
  criteria: unknown[];
  measures: unknown[];
  decisions: unknown[];
};

const filled = (s: string) => s.trim().length > 0;

export function sectionHasContent(f: FeatureContent, key: SectionKey): boolean {
  switch (key) {
    case "evidence": return f.sources.length > 0;
    case "problem": return filled(f.problem) || filled(f.constraints);
    case "audience": return filled(f.audience) || filled(f.currentBehaviour);
    case "outcome": return filled(f.outcome);
    case "assumptions": return f.assumptions.length > 0;
    case "open_questions": return f.questions.length > 0;
    case "scope": return f.scopeItems.length > 0;
    case "alternatives": return f.alternatives.length > 0;
    case "acceptance_criteria": return f.criteria.length > 0;
    case "measures": return f.measures.length > 0;
    case "decisions": return f.decisions.length > 0;
  }
}

/** Empty always wins: a section with no content cannot be agreed. */
export function deriveStatus(hasContent: boolean, stored: StoredStatus | undefined): SectionStatus {
  if (!hasContent) return "empty";
  return stored === "agreed" ? "agreed" : "proposed";
}

export function sectionStatuses(
  f: FeatureContent,
  stored: { section: string; status: string }[],
): Record<SectionKey, SectionStatus> {
  const map = new Map(stored.map((s) => [s.section, s.status]));
  const out = {} as Record<SectionKey, SectionStatus>;
  for (const key of SECTION_KEYS) {
    const raw = map.get(key);
    out[key] = deriveStatus(sectionHasContent(f, key), isOneOf(STORED_STATUSES, raw) ? raw : undefined);
  }
  return out;
}

export function progress(statuses: Record<SectionKey, SectionStatus>) {
  const values = Object.values(statuses);
  return {
    total: values.length,
    agreed: values.filter((s) => s === "agreed").length,
    proposed: values.filter((s) => s === "proposed").length,
    empty: values.filter((s) => s === "empty").length,
  };
}

/** A step's status: empty if all its sections are empty, agreed if all are agreed. */
export function stepStatus(statuses: SectionStatus[]): SectionStatus {
  if (statuses.length === 0 || statuses.every((s) => s === "empty")) return "empty";
  if (statuses.every((s) => s === "agreed")) return "agreed";
  return "proposed";
}
