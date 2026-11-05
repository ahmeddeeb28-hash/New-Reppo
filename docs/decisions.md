# Decision log

Choices made where the design doc was silent, as the doc asks. Newest first.

## Milestone 1 — data model and feature editing (Nov 2026)

| # | Decision | Reason | Revisit when |
|---|----------|--------|--------------|
| 1 | The app lives in `workspace/`, next to the static landing page at the repo root. | Keeps GitHub Pages serving the landing page unchanged. | We host the app and landing page together. |
| 2 | Pinned to Next.js 15.5, React 19.1, Prisma 6, Tailwind 4.1, Zod 3 rather than the newest majors. | Stable, well-known APIs for the pilot. | After the pilot, as a planned upgrade. |
| 3 | Plain Tailwind components instead of shadcn/ui for now. | M1 needs only forms, cards and chips; avoids extra dependencies. Can be adopted later without data changes. | Milestones with dialogs, menus or comboboxes (M5). |
| 4 | Enum-like fields (roles, statuses, kinds) are strings validated with Zod in `src/lib/domain.ts`. | Same schema works on SQLite locally and Postgres when hosted. | Moving to Postgres-only. |
| 5 | Section status stores only `proposed` or `agreed`; `empty` is derived from content. A section with no content always shows empty and can't be agreed. | Status can never disagree with what's on the page. | — |
| 6 | Editing an agreed section reopens it as proposed and writes a history entry. | Agreement should cover the content people actually agreed to. | Pilot feedback says this is too strict for typo fixes. |
| 7 | Measure values (baseline, target, cohort, window) are free text, and blank shows "Unknown". | Keeps units and dates exactly as entered; the app never fills a value. | We need numeric comparison for post-launch learning. |
| 8 | The pasted request is saved as the first Source, "Original request". | Later claims and decisions can cite it like any other source. | — |
| 9 | No sign-in yet. History `actor` is blank except for decisions, which record "Decided by" as typed. | Magic-link auth and workspaces are not in M1's acceptance criteria. | Before any pilot team uses a shared deployment. |
| 10 | Decisions can be withdrawn (deleted) but not edited; both recording and withdrawal are logged. | Keeps the reasoning trail honest without a full versioning system. | Approval and version locking in M6. |
| 11 | Each record has a `state` field (`proposed` / `accepted`), defaulting to accepted for items people type. | Ready for AI proposals in M2–M3 without a migration. | — |
| 12 | File attachments are deferred to M2; M1 sources are pasted text or links. | M1 covers editing every Feature field; uploads need storage decisions. | M2. |
