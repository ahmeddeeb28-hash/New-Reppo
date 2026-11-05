import { addDecision, withdrawDecision } from "@/app/features/actions";
import type { LoadedFeature } from "@/lib/queries";
import { SectionCard } from "../SectionCard";
import { AddPanel, CheckboxList, TextArea, TextInput } from "../Fields";
import { Hidden } from "../Hidden";
import { RemoveButton } from "../RemoveButton";
import { SubmitButton } from "../SubmitButton";
import { ClaimTag } from "../ClaimTag";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ReviewStep({ data }: { data: LoadedFeature }) {
  const { feature: f, statuses } = data;
  const aTitle = new Map(f.assumptions.map((a) => [a.id, a.statement]));
  const sTitle = new Map(f.sources.map((s) => [s.id, s.title]));
  return (
    <>
      <div className="rounded-md border border-dashed border-line p-4 text-sm text-muted">
        Role-specific review questions and comments arrive in the next milestones. For now, record what the team decides and what each decision rests on.
      </div>
      <SectionCard featureId={f.id} section="decisions" status={statuses.decisions}>
        {f.decisions.length > 0 && (
          <ul className="flex flex-col gap-3">
            {f.decisions.map((d) => (
              <li key={d.id} className="rounded-md border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimTag kind="decision" />
                      <span className="font-mono text-[0.68rem] uppercase tracking-wider text-muted">{d.decidedBy} · {dateFmt.format(d.decidedAt)}</span>
                    </div>
                    <p className="mt-2 font-semibold">{d.what}</p>
                    <p className="mt-1 text-sm text-muted">Reason: {d.reason}</p>
                    {d.assumptions.length > 0 && <p className="mt-1 text-sm"><span className="text-assumption">Rests on assumptions:</span> {d.assumptions.map((a) => aTitle.get(a.assumptionId)).join("; ")}</p>}
                    {d.sources.length > 0 && <p className="mt-1 text-sm"><span className="text-evidence">Sources:</span> {d.sources.map((s) => sTitle.get(s.sourceId)).join(", ")}</p>}
                  </div>
                  <RemoveButton action={withdrawDecision} featureId={f.id} id={d.id} label="Withdraw" />
                </div>
              </li>
            ))}
          </ul>
        )}
        <AddPanel title="Record a decision">
          <form action={addDecision} className="grid gap-4 sm:grid-cols-2">
            <Hidden name="featureId" value={f.id} />
            <div className="sm:col-span-2"><TextArea id="d-what" name="what" label="What was decided" rows={2} required /></div>
            <div className="sm:col-span-2"><TextArea id="d-reason" name="reason" label="Reason" rows={2} required /></div>
            <TextInput id="d-by" name="decidedBy" label="Decided by" required placeholder="Names or roles" />
            <div />
            <CheckboxList idPrefix="d-a" name="assumptionIds" legend="Rests on assumptions" items={f.assumptions.map((a) => ({ id: a.id, label: a.statement }))} empty="No assumptions registered." />
            <CheckboxList idPrefix="d-s" name="sourceIds" legend="Supported by sources" items={f.sources.map((s) => ({ id: s.id, label: s.title }))} empty="No sources added." />
            <div><SubmitButton>Record decision</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>
    </>
  );
}
