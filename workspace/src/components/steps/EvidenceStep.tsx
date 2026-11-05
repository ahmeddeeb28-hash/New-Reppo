import { addAssumption, addQuestion, answerQuestion, removeAssumption, removeQuestion, updateAssumption } from "@/app/features/actions";
import { ASSUMPTION_STATUSES, ROLE_LABELS, ROLES } from "@/lib/domain";
import type { LoadedFeature } from "@/lib/queries";
import { SectionCard } from "../SectionCard";
import { AddPanel, CheckboxList, Select, TextArea, TextInput } from "../Fields";
import { Hidden } from "../Hidden";
import { RemoveButton } from "../RemoveButton";
import { SubmitButton } from "../SubmitButton";
import { ClaimTag } from "../ClaimTag";

const statusLabel = { untested: "Untested", testing: "Testing", supported: "Supported", refuted: "Refuted" } as const;
const statusOptions = ASSUMPTION_STATUSES.map((s) => ({ value: s, label: statusLabel[s] }));
const roleOptions = ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }));

function AssumptionFields({ prefix, a, sources }: { prefix: string; a?: LoadedFeature["feature"]["assumptions"][number]; sources: { id: string; label: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><TextArea id={`${prefix}-statement`} name="statement" label="Belief, in one sentence" defaultValue={a?.statement} rows={2} required placeholder="Easier reordering increases repeat purchases." /></div>
      <TextArea id={`${prefix}-why`} name="whyItMatters" label="What breaks if it's wrong" defaultValue={a?.whyItMatters} rows={2} />
      <TextArea id={`${prefix}-test`} name="proposedTest" label="How it will be checked" defaultValue={a?.proposedTest} rows={2} />
      <TextArea id={`${prefix}-need`} name="evidenceNeeded" label="Result that would confirm or refute it" defaultValue={a?.evidenceNeeded} rows={2} />
      <div className="flex flex-col gap-4">
        <TextInput id={`${prefix}-owner`} name="owner" label="Owner" defaultValue={a?.owner} placeholder="A person, not a team" />
        <Select id={`${prefix}-status`} name="status" label="Status" options={statusOptions} defaultValue={a?.status ?? "untested"} />
      </div>
      <div className="sm:col-span-2">
        <CheckboxList idPrefix={`${prefix}-src`} name="sourceIds" legend="Related sources" items={sources} checked={a?.sources.map((s) => s.sourceId)} empty="No sources yet. Add them in step 1." />
        <p className="mt-2 text-xs text-muted">Linking a source doesn't turn an assumption into a fact. Change the status when a test gives a result.</p>
      </div>
    </div>
  );
}

export function EvidenceStep({ data }: { data: LoadedFeature }) {
  const { feature: f, statuses } = data;
  const sources = f.sources.map((s) => ({ id: s.id, label: s.title }));
  const sourceTitle = new Map(f.sources.map((s) => [s.id, s.title]));
  return (
    <>
      <SectionCard featureId={f.id} section="assumptions" status={statuses.assumptions}>
        {f.assumptions.length > 0 && (
          <ul className="flex flex-col gap-3">
            {f.assumptions.map((a) => {
              const missing = [!a.owner && "owner", !a.proposedTest && "test"].filter(Boolean);
              return (
                <li key={a.id} className="rounded-md border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <ClaimTag kind="assumption" />
                        <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted">{statusLabel[a.status as keyof typeof statusLabel] ?? a.status}</span>
                      </div>
                      <p className="mt-2 font-semibold">{a.statement}</p>
                      <p className="mt-1 text-sm text-muted">
                        Owner: {a.owner || <em>none</em>} · Test: {a.proposedTest || <em>none</em>}
                        {a.sources.length > 0 && <> · Sources: {a.sources.map((s) => sourceTitle.get(s.sourceId)).join(", ")}</>}
                      </p>
                      {missing.length > 0 && <p className="mt-1 text-xs text-assumption">Needs {missing.join(" and ")}.</p>}
                    </div>
                    <RemoveButton action={removeAssumption} featureId={f.id} id={a.id} />
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-accent">Edit</summary>
                    <form action={updateAssumption} key={a.updatedAt.getTime()} className="mt-3 flex flex-col gap-4">
                      <Hidden name="featureId" value={f.id} />
                      <Hidden name="id" value={a.id} />
                      <AssumptionFields prefix={`a-${a.id}`} a={a} sources={sources} />
                      <div><SubmitButton>Save assumption</SubmitButton></div>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        <AddPanel title="Register an assumption">
          <form action={addAssumption} className="flex flex-col gap-4">
            <Hidden name="featureId" value={f.id} />
            <AssumptionFields prefix="new-a" sources={sources} />
            <div><SubmitButton>Register assumption</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>

      <SectionCard featureId={f.id} section="open_questions" status={statuses.open_questions}>
        {f.questions.length > 0 && (
          <ul className="flex flex-col gap-3">
            {f.questions.map((q) => (
              <li key={q.id} className={`rounded-md border border-line p-4 ${q.resolved ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimTag kind="question" />
                      <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted">
                        {ROLE_LABELS[q.assignedRole as keyof typeof ROLE_LABELS] ?? q.assignedRole}{q.assignee && ` · ${q.assignee}`}{q.resolved && " · Resolved"}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold">{q.text}</p>
                  </div>
                  <RemoveButton action={removeQuestion} featureId={f.id} id={q.id} />
                </div>
                <form action={answerQuestion} key={`${q.answer}${q.resolved}`} className="mt-3 flex flex-col gap-3">
                  <Hidden name="featureId" value={f.id} />
                  <Hidden name="id" value={q.id} />
                  <TextArea id={`ans-${q.id}`} name="answer" label="Answer" defaultValue={q.answer} rows={2} />
                  <div className="flex flex-wrap items-center gap-4">
                    <label htmlFor={`res-${q.id}`} className="flex items-center gap-2 text-sm">
                      <input id={`res-${q.id}`} type="checkbox" name="resolved" defaultChecked={q.resolved} className="accent-[var(--accent)]" /> Resolved
                    </label>
                    <SubmitButton className="btn btn-ghost">Save answer</SubmitButton>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
        <AddPanel title="Add an open question">
          <form action={addQuestion} className="grid gap-4 sm:grid-cols-2">
            <Hidden name="featureId" value={f.id} />
            <div className="sm:col-span-2"><TextArea id="q-text" name="text" label="Question" rows={2} required placeholder="What happens when an item is unavailable?" /></div>
            <Select id="q-role" name="assignedRole" label="Who answers it" options={roleOptions} />
            <TextInput id="q-assignee" name="assignee" label="Person (optional)" />
            <div><SubmitButton>Add question</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>
    </>
  );
}
