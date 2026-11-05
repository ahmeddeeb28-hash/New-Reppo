import { addAlternative, addCriterion, addScopeItem, removeAlternative, removeCriterion, removeScopeItem, toggleScopeItem } from "@/app/features/actions";
import type { LoadedFeature } from "@/lib/queries";
import { SectionCard } from "../SectionCard";
import { AddPanel, TextArea, TextInput } from "../Fields";
import { Hidden } from "../Hidden";
import { RemoveButton } from "../RemoveButton";
import { SubmitButton } from "../SubmitButton";

export function ScopeStep({ data }: { data: LoadedFeature }) {
  const { feature: f, statuses } = data;
  const inItems = f.scopeItems.filter((s) => s.inScope);
  const outItems = f.scopeItems.filter((s) => !s.inScope);
  const column = (title: string, items: typeof f.scopeItems, moveLabel: string) => (
    <div className="min-w-0 rounded-md border border-line p-4">
      <h3 className="font-mono text-[0.7rem] uppercase tracking-wider text-muted">{title} · {items.length}</h3>
      {items.length === 0 ? <p className="mt-2 text-sm text-muted">Nothing yet.</p> : (
        <ul className="mt-2 flex flex-col divide-y divide-line">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-start justify-between gap-2 py-2">
              <span className="min-w-0 flex-1 text-sm">{s.text}</span>
              <span className="flex">
                <RemoveButton action={toggleScopeItem} featureId={f.id} id={s.id} label={moveLabel} />
                <RemoveButton action={removeScopeItem} featureId={f.id} id={s.id} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
  return (
    <>
      <SectionCard featureId={f.id} section="scope" status={statuses.scope}>
        <div className="grid gap-4 md:grid-cols-2">
          {column("In this release", inItems, "Move out")}
          {column("Out of this release", outItems, "Move in")}
        </div>
        <AddPanel title="Add a scope item">
          <form action={addScopeItem} className="flex flex-col gap-4">
            <Hidden name="featureId" value={f.id} />
            <TextInput id="scope-text" name="text" label="Item" required placeholder="Rebuild a previous basket with current prices" />
            <fieldset className="flex gap-5 text-sm">
              <legend className="label">Where it goes</legend>
              <label htmlFor="scope-in" className="flex items-center gap-2"><input id="scope-in" type="radio" name="inScope" value="in" defaultChecked className="accent-[var(--accent)]" /> In scope</label>
              <label htmlFor="scope-out" className="flex items-center gap-2"><input id="scope-out" type="radio" name="inScope" value="out" className="accent-[var(--accent)]" /> Out of scope</label>
            </fieldset>
            <div><SubmitButton>Add item</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>

      <SectionCard featureId={f.id} section="alternatives" status={statuses.alternatives}>
        {f.alternatives.length > 0 && (
          <ul className="flex flex-col gap-3">
            {f.alternatives.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-line p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.description}</p>
                  <p className="mt-1 text-sm text-muted">Why not: {a.whyNotChosen || <em>no reason recorded yet</em>}</p>
                </div>
                <RemoveButton action={removeAlternative} featureId={f.id} id={a.id} />
              </li>
            ))}
          </ul>
        )}
        <AddPanel title="Add an alternative">
          <form action={addAlternative} className="flex flex-col gap-4">
            <Hidden name="featureId" value={f.id} />
            <TextArea id="alt-desc" name="description" label="Other release boundary" rows={2} required placeholder="Reorder only the single most recent order" />
            <TextArea id="alt-why" name="whyNotChosen" label="Why it wasn't chosen" rows={2} />
            <div><SubmitButton>Add alternative</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>

      <SectionCard featureId={f.id} section="acceptance_criteria" status={statuses.acceptance_criteria}>
        {f.criteria.length > 0 && (
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            {f.criteria.map((c) => (
              <li key={c.id} className="pl-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 text-sm">{c.text}</span>
                  <RemoveButton action={removeCriterion} featureId={f.id} id={c.id} />
                </div>
              </li>
            ))}
          </ol>
        )}
        <AddPanel title="Add a criterion">
          <form action={addCriterion} className="flex flex-col gap-4">
            <Hidden name="featureId" value={f.id} />
            <TextArea id="crit-text" name="text" label="Testable statement" rows={2} required placeholder="Unavailable items are shown and excluded before checkout" />
            <div><SubmitButton>Add criterion</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>
    </>
  );
}
