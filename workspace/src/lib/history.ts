import type { Tx } from "./db";
import type { SectionKey } from "./domain";

type Entry = {
  featureId: string;
  entity: "feature" | "section" | "scope" | "assumption" | "decision";
  entityId: string;
  action: string;
  detail?: string;
  actor?: string;
};

/** The only writer of HistoryEntry. Entries are never updated or deleted by the app. */
export function logHistory(tx: Tx, e: Entry) {
  return tx.historyEntry.create({
    data: { ...e, detail: e.detail ?? "", actor: e.actor ?? "" },
  });
}

/**
 * Call after any content change in a section. If the team had agreed the
 * section, the edit reopens it so the change gets reviewed again.
 */
export async function reopenIfAgreed(tx: Tx, featureId: string, section: SectionKey) {
  const state = await tx.sectionState.findUnique({
    where: { featureId_section: { featureId, section } },
  });
  if (state?.status === "agreed") {
    await tx.sectionState.update({ where: { id: state.id }, data: { status: "proposed" } });
    await logHistory(tx, {
      featureId,
      entity: "section",
      entityId: section,
      action: "reopened",
      detail: "Content changed after the section was agreed",
    });
  }
}
