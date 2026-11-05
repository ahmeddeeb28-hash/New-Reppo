import { Hidden } from "./Hidden";
import { SubmitButton } from "./SubmitButton";

type Action = (fd: FormData) => Promise<void>;

export function RemoveButton({ action, featureId, id, label = "Remove" }: { action: Action; featureId: string; id: string; label?: string }) {
  return (
    <form action={action}>
      <Hidden name="featureId" value={featureId} />
      <Hidden name="id" value={id} />
      <SubmitButton className="btn-quiet" pendingText="…">{label}</SubmitButton>
    </form>
  );
}
