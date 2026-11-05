const map = {
  evidence: ["Evidence", "bg-evidence-bg text-evidence"],
  assumption: ["Assumption", "bg-assumption-bg text-assumption"],
  question: ["Open question", "bg-question-bg text-question"],
  decision: ["Decision", "bg-decision-bg text-decision"],
} as const;

export function ClaimTag({ kind }: { kind: keyof typeof map }) {
  const [label, cls] = map[kind];
  return <span className={`inline-block rounded px-2 py-0.5 font-mono text-[0.66rem] uppercase tracking-wider ${cls}`}>{label}</span>;
}
