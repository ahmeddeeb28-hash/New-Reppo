import type { SectionStatus } from "@/lib/domain";

const styles: Record<SectionStatus, string> = {
  empty: "border border-dashed border-muted text-muted",
  proposed: "bg-assumption-bg text-assumption",
  agreed: "bg-evidence-bg text-evidence",
};
const labels: Record<SectionStatus, string> = { empty: "Empty", proposed: "Proposed", agreed: "Agreed" };

export function StatusChip({ status }: { status: SectionStatus }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

const dot: Record<SectionStatus, string> = {
  empty: "border border-muted",
  proposed: "bg-assumption",
  agreed: "bg-evidence",
};
export function StatusDot({ status }: { status: SectionStatus }) {
  return <span aria-label={labels[status]} className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${dot[status]}`} />;
}
