import Link from "next/link";
import { db } from "@/lib/db";
import { progress, sectionStatuses } from "@/lib/domain";
import { createFeature } from "./features/actions";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const features = await db.feature.findMany({
    orderBy: { updatedAt: "desc" },
    include: { sections: true, sources: true, assumptions: true, questions: true, scopeItems: true, alternatives: true, criteria: true, measures: true, decisions: true },
  });

  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1fr_380px]">
      <section aria-labelledby="features-title" className="min-w-0">
        <h1 id="features-title" className="text-3xl font-bold">Features</h1>
        <p className="mt-1 text-muted">Each feature moves through seven steps until the team agrees its definition.</p>

        {features.length === 0 ? (
          <div className="card mt-6 border-dashed p-8 text-center text-muted">
            No features yet. Paste an idea in the form to start your first definition.
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {features.map((f) => {
              const p = progress(sectionStatuses(f, f.sections));
              const pct = Math.round((p.agreed / p.total) * 100);
              return (
                <li key={f.id}>
                  <Link href={`/features/${f.id}/context`} className="card block p-5 transition hover:border-ink focus-visible:outline-2 focus-visible:outline-accent">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-bold">{f.title}</h2>
                      {f.isExample && <span className="rounded bg-question-bg px-2 py-0.5 font-mono text-[0.66rem] uppercase tracking-wider text-question">Example</span>}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{f.request}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
                        <div className="h-full bg-evidence" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono text-xs tabular-nums text-muted">
                        {p.agreed} of {p.total} sections agreed
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside aria-labelledby="new-title" className="card h-fit p-6">
        <h2 id="new-title" className="text-xl font-bold">Start a definition</h2>
        <p className="mt-1 text-sm text-muted">Paste the request as you received it. It becomes the first source.</p>
        <form action={createFeature} className="mt-5 flex flex-col gap-4">
          <div>
            <label htmlFor="title" className="label">Feature name</label>
            <input id="title" name="title" required maxLength={140} className="field" placeholder="One-tap reorder" />
          </div>
          <div>
            <label htmlFor="request" className="label">Request or idea</label>
            <textarea id="request" name="request" required rows={5} maxLength={4000} className="field" placeholder="We want one-tap reorder to increase repeat purchases." />
          </div>
          <SubmitButton pendingText="Creating…">Create feature</SubmitButton>
        </form>
      </aside>
    </main>
  );
}
