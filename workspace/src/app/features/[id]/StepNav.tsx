"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { SectionStatus } from "@/lib/domain";
import { StatusDot } from "@/components/StatusChip";

export function StepNav({ featureId, steps }: { featureId: string; steps: { slug: string; n: number; title: string; status: SectionStatus }[] }) {
  const path = usePathname();
  const listRef = useRef<HTMLOListElement>(null);
  // On narrow screens the steps scroll sideways; keep the current one in view.
  useEffect(() => {
    listRef.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [path]);
  return (
    <nav aria-label="Definition steps">
      <ol ref={listRef} className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {steps.map((s) => {
          const href = `/features/${featureId}/${s.slug}`;
          const active = path === href;
          return (
            <li key={s.slug} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition focus-visible:outline-2 focus-visible:outline-accent ${active ? "bg-accent-soft font-semibold text-ink" : "text-muted hover:bg-surface hover:text-ink"}`}
              >
                <span className="font-mono text-xs tabular-nums">{s.n}</span>
                <span className="whitespace-nowrap">{s.title}</span>
                {s.slug !== "share" && <span className="ml-auto pl-2"><StatusDot status={s.status} /></span>}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
