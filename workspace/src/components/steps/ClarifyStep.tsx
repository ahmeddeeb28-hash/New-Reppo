import { saveAudience, saveOutcome, saveProblem } from "@/app/features/actions";
import type { LoadedFeature } from "@/lib/queries";
import { SectionCard } from "../SectionCard";
import { TextArea } from "../Fields";
import { Hidden } from "../Hidden";
import { SubmitButton } from "../SubmitButton";

export function ClarifyStep({ data }: { data: LoadedFeature }) {
  const { feature: f, statuses } = data;
  const v = f.updatedAt.getTime();
  return (
    <>
      <SectionCard featureId={f.id} section="problem" status={statuses.problem}>
        <form action={saveProblem} key={`p${v}`} className="flex flex-col gap-4">
          <Hidden name="featureId" value={f.id} />
          <TextArea id="field-problem" name="problem" label="Problem" defaultValue={f.problem} rows={4} placeholder="Who is affected, and how does the problem show up today?" />
          <TextArea id="field-constraints" name="constraints" label="Constraints" defaultValue={f.constraints} placeholder="Deadlines, platforms, policies, dependencies" />
          <div><SubmitButton>Save problem</SubmitButton></div>
        </form>
      </SectionCard>

      <SectionCard featureId={f.id} section="audience" status={statuses.audience}>
        <form action={saveAudience} key={`a${v}`} className="flex flex-col gap-4">
          <Hidden name="featureId" value={f.id} />
          <TextArea id="field-audience" name="audience" label="Target user" defaultValue={f.audience} placeholder="Which customers is this for?" />
          <TextArea id="field-current" name="currentBehaviour" label="What they do today" defaultValue={f.currentBehaviour} placeholder="Describe current behaviour. Leave blank if unknown, and add an open question instead." />
          <div><SubmitButton>Save audience</SubmitButton></div>
        </form>
      </SectionCard>

      <SectionCard featureId={f.id} section="outcome" status={statuses.outcome}>
        <form action={saveOutcome} key={`o${v}`} className="flex flex-col gap-4">
          <Hidden name="featureId" value={f.id} />
          <TextArea id="field-outcome" name="outcome" label="Intended change in behaviour" defaultValue={f.outcome} placeholder="What should people do differently if this works?" />
          <div><SubmitButton>Save outcome</SubmitButton></div>
        </form>
      </SectionCard>
    </>
  );
}
