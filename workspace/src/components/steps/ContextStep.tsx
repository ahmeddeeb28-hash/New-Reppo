import { addSource, removeSource, renameFeature } from "@/app/features/actions";
import type { LoadedFeature } from "@/lib/queries";
import { SectionCard } from "../SectionCard";
import { AddPanel, Select, TextArea, TextInput } from "../Fields";
import { Hidden } from "../Hidden";
import { RemoveButton } from "../RemoveButton";
import { SubmitButton } from "../SubmitButton";
import { ClaimTag } from "../ClaimTag";

export function ContextStep({ data }: { data: LoadedFeature }) {
  const { feature, statuses } = data;
  return (
    <>
      <div className="card p-5 sm:p-6">
        <span className="label">Original request</span>
        <p className="text-lg italic">“{feature.request}”</p>
        <form action={renameFeature} key={feature.title} className="mt-5 flex flex-wrap items-end gap-3">
          <Hidden name="featureId" value={feature.id} />
          <div className="min-w-0 flex-1">
            <TextInput id="feature-title" name="title" label="Feature name" defaultValue={feature.title} required />
          </div>
          <SubmitButton className="btn btn-ghost">Rename</SubmitButton>
        </form>
      </div>

      <SectionCard featureId={feature.id} section="evidence" status={statuses.evidence}>
        {feature.sources.length > 0 && (
          <ul className="flex flex-col gap-3">
            {feature.sources.map((s) => (
              <li key={s.id} className="rounded-md border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ClaimTag kind="evidence" />
                      <h3 className="font-semibold">{s.title}</h3>
                    </div>
                    {s.origin && <p className="mt-1 text-xs text-muted">From: {s.origin}</p>}
                  </div>
                  <RemoveButton action={removeSource} featureId={feature.id} id={s.id} />
                </div>
                {s.content && (
                  s.kind === "link"
                    ? <a href={s.content} className="mt-2 block break-all text-sm text-accent" target="_blank" rel="noreferrer">{s.content}</a>
                    : <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted">{s.content}</p>
                )}
              </li>
            ))}
          </ul>
        )}
        <AddPanel title="Add a source">
          <form action={addSource} className="grid gap-4 sm:grid-cols-2">
            <Hidden name="featureId" value={feature.id} />
            <TextInput id="src-title" name="title" label="Title" required placeholder="Support tickets, October" />
            <TextInput id="src-origin" name="origin" label="Where it came from" placeholder="Zendesk export, interview, competitor page" />
            <Select id="src-kind" name="kind" label="Type" options={[{ value: "text", label: "Pasted text" }, { value: "link", label: "Link" }]} />
            <div className="sm:col-span-2">
              <TextArea id="src-content" name="content" label="Content or URL" rows={5} placeholder="Paste notes, quotes or a link" />
            </div>
            <p className="text-xs text-muted sm:col-span-2">Sources are kept as you add them and are never rewritten. Adding one doesn't change any decision.</p>
            <div><SubmitButton>Add source</SubmitButton></div>
          </form>
        </AddPanel>
      </SectionCard>
    </>
  );
}
