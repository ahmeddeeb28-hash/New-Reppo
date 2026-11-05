import { setSectionStatus } from "@/app/features/actions";
import { SECTIONS, type SectionKey, type SectionStatus } from "@/lib/domain";
import { Hidden } from "./Hidden";
import { StatusChip } from "./StatusChip";
import { SubmitButton } from "./SubmitButton";

export function SectionCard({
  featureId,
  section,
  status,
  children,
}: {
  featureId: string;
  section: SectionKey;
  status: SectionStatus;
  children: React.ReactNode;
}) {
  const meta = SECTIONS[section];
  return (
    <section id={section} className="card scroll-mt-6 p-5 sm:p-6" aria-labelledby={`${section}-title`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 id={`${section}-title`} className="text-xl font-bold">{meta.title}</h2>
            <StatusChip status={status} />
          </div>
          <p className="mt-1 text-sm text-muted">{meta.hint}</p>
        </div>
        {status !== "empty" && (
          <form action={setSectionStatus}>
            <Hidden name="featureId" value={featureId} />
            <Hidden name="section" value={section} />
            <Hidden name="status" value={status === "agreed" ? "proposed" : "agreed"} />
            <SubmitButton className={status === "agreed" ? "btn btn-ghost" : "btn"} pendingText="Updating…">
              {status === "agreed" ? "Reopen" : "Mark agreed"}
            </SubmitButton>
          </form>
        )}
      </div>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}
