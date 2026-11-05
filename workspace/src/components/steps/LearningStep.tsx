import { addMeasure, removeMeasure, updateMeasure } from "@/app/features/actions";
import type { LoadedFeature } from "@/lib/queries";
import { SectionCard } from "../SectionCard";
import { AddPanel, Select, TextArea, TextInput, ValueOrUnknown } from "../Fields";
import { Hidden } from "../Hidden";
import { RemoveButton } from "../RemoveButton";
import { SubmitButton } from "../SubmitButton";

type M = LoadedFeature["feature"]["measures"][number];
const kindOptions = [{ value: "success", label: "Success measure" }, { value: "guardrail", label: "Guardrail" }];

function MeasureFields({ prefix, m }: { prefix: string; m?: M }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select id={`${prefix}-kind`} name="kind" label="Type" options={kindOptions} defaultValue={m?.kind ?? "success"} />
      <TextInput id={`${prefix}-metric`} name="metric" label="Metric" defaultValue={m?.metric} required placeholder="Completed repeat orders" />
      <TextInput id={`${prefix}-cohort`} name="cohort" label="Cohort" defaultValue={m?.cohort} placeholder="Customers with 2+ past orders" />
      <TextInput id={`${prefix}-window`} name="window" label="Measurement window" defaultValue={m?.window} placeholder="28 days after exposure" />
      <TextInput id={`${prefix}-baseline`} name="baseline" label="Baseline" defaultValue={m?.baseline} hint="Leave blank if you don't have it yet." />
      <TextInput id={`${prefix}-target`} name="target" label="Target" defaultValue={m?.target} hint="Leave blank until there's a baseline and an evaluation design." />
      <div className="sm:col-span-2"><TextArea id={`${prefix}-missing`} name="missingInstrumentation" label="Missing instrumentation" defaultValue={m?.missingInstrumentation} rows={2} placeholder="Events or data you'd need to measure this" /></div>
    </div>
  );
}

export function LearningStep({ data }: { data: LoadedFeature }) {
  const { feature: f, statuses } = data;
  const groups = [
    { kind: "success", title: "Success measures" },
    { kind: "guardrail", title: "Guardrails" },
  ];
  return (
    <SectionCard featureId={f.id} section="measures" status={statuses.measures}>
      {groups.map((g) => {
        const items = f.measures.filter((m) => m.kind === g.kind);
        if (items.length === 0) return null;
        return (
          <div key={g.kind}>
            <h3 className="font-mono text-[0.7rem] uppercase tracking-wider text-muted">{g.title}</h3>
            <ul className="mt-2 flex flex-col gap-3">
              {items.map((m) => (
                <li key={m.id} className="rounded-md border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 flex-1 font-semibold">{m.metric}</p>
                    <RemoveButton action={removeMeasure} featureId={f.id} id={m.id} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
                    <div><dt className="label">Baseline</dt><dd><ValueOrUnknown value={m.baseline} /></dd></div>
                    <div><dt className="label">Target</dt><dd><ValueOrUnknown value={m.target} /></dd></div>
                    <div><dt className="label">Cohort</dt><dd><ValueOrUnknown value={m.cohort} /></dd></div>
                    <div><dt className="label">Window</dt><dd><ValueOrUnknown value={m.window} /></dd></div>
                  </dl>
                  {m.missingInstrumentation && <p className="mt-3 text-sm text-assumption">Missing instrumentation: {m.missingInstrumentation}</p>}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-accent">Edit</summary>
                    <form action={updateMeasure} key={JSON.stringify(m)} className="mt-3 flex flex-col gap-4">
                      <Hidden name="featureId" value={f.id} />
                      <Hidden name="id" value={m.id} />
                      <MeasureFields prefix={`m-${m.id}`} m={m} />
                      <div><SubmitButton>Save measure</SubmitButton></div>
                    </form>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <p className="text-sm text-muted">A measurement plan names how impact will be evaluated. It never states expected impact as fact.</p>
      <AddPanel title="Add a measure">
        <form action={addMeasure} className="flex flex-col gap-4">
          <Hidden name="featureId" value={f.id} />
          <MeasureFields prefix="new-m" />
          <div><SubmitButton>Add measure</SubmitButton></div>
        </form>
      </AddPanel>
    </SectionCard>
  );
}
