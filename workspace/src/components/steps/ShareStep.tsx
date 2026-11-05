import Link from "next/link";
import { deleteFeature } from "@/app/features/actions";
import { SECTIONS, STEPS } from "@/lib/domain";
import type { LoadedFeature } from "@/lib/queries";
import { StatusChip } from "../StatusChip";
import { Hidden } from "../Hidden";
import { SubmitButton } from "../SubmitButton";

const timeFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ShareStep({ data }: { data: LoadedFeature }) {
  const { feature: f, statuses, progress } = data;
  const ready = progress.agreed === progress.total;
  return (
    <>
      <div className="card p-5 sm:p-6">
        <h3 className="text-lg font-bold">{ready ? "Every section is agreed" : "Not ready to share yet"}</h3>
        <p className="mt-1 text-sm text-muted">
          {ready
            ? "Approval, version locking and export of the summary and brief arrive in milestone 6."
            : `${progress.agreed} of ${progress.total} sections are agreed. Sections still proposed or empty are listed below.`}
        </p>
        <ul className="mt-5 divide-y divide-line">
          {STEPS.filter((s) => s.sections.length > 0).flatMap((step) =>
            step.sections.map((key) => (
              <li key={key} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link href={`/features/${f.id}/${step.slug}#${key}`} className="text-sm hover:underline">
                  <span className="mr-2 font-mono text-xs text-muted">{step.n}</span>{SECTIONS[key].title}
                </Link>
                <StatusChip status={statuses[key]} />
              </li>
            )),
          )}
        </ul>
      </div>

      <div className="card p-5 sm:p-6">
        <h3 className="text-lg font-bold">History</h3>
        <p className="mt-1 text-sm text-muted">Changes to scope, decisions, assumption status and agreement. Entries can't be edited.</p>
        {f.history.length === 0 ? <p className="mt-4 text-sm text-muted">No changes yet.</p> : (
          <ol className="mt-4 flex flex-col gap-3">
            {f.history.map((h) => (
              <li key={h.id} className="grid gap-1 text-sm sm:grid-cols-[130px_1fr]">
                <time className="font-mono text-xs tabular-nums text-muted" dateTime={h.createdAt.toISOString()}>{timeFmt.format(h.createdAt)}</time>
                <span className="min-w-0">
                  <span className="font-semibold capitalize">{h.entity === "section" ? (SECTIONS[h.entityId as keyof typeof SECTIONS]?.title ?? h.entityId) : h.entity}</span>{" "}
                  {h.action}{h.actor && ` by ${h.actor}`}
                  {h.detail && <span className="block text-muted">{h.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <details className="rounded-md border border-line p-4">
        <summary className="cursor-pointer text-sm text-danger">Delete this feature</summary>
        <form action={deleteFeature} className="mt-3 flex flex-wrap items-center gap-3">
          <Hidden name="featureId" value={f.id} />
          <p className="text-sm text-muted">This removes the feature and all its records. It can't be undone.</p>
          <SubmitButton className="btn border-danger bg-danger" pendingText="Deleting…">Delete feature</SubmitButton>
        </form>
      </details>
    </>
  );
}
