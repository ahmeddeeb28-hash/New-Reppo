# Scopeline workspace

The pilot app for the feature-definition workspace. A PM, designer, growth lead and engineer use it to agree one feature's scope, assumptions and success measures before delivery starts.

Status: **Milestone 1** (data model and editing every section) is complete. See `../docs/decisions.md` for choices made along the way.

## Run it

Requires Node 20 or later.

```bash
npm install
cp .env.example .env
npm run setup     # creates the SQLite database and seeds the example feature
npm run dev       # http://localhost:3000
```

## Check it

```bash
npm test          # unit tests for domain rules and validation
npm run lint      # type check
```

The browser acceptance test for milestone 1 needs the app running on port 3000 and Playwright installed:

```bash
node e2e/m1.mjs
```

## How it's organised

```
prisma/schema.prisma      Data model: Feature and every record it owns
prisma/seed.ts            The repeat-ordering example from the design doc
src/lib/domain.ts         Sections, steps and status rules (unit-tested)
src/lib/validation.ts     Form validation
src/lib/history.ts        Append-only history and the reopen-on-edit rule
src/app/features/actions.ts  Server actions that save every section
src/components/steps/     One screen per step
```

## Rules the app enforces

- A section with no content shows **Empty** and can't be agreed.
- Editing an agreed section reopens it as **Proposed** and logs the change.
- Blank baselines, targets, cohorts and windows show as **Unknown**. The app never fills them in.
- Linking a source to an assumption doesn't change its status.
- Scope changes, decisions, assumption status changes and agreement are logged in an append-only history.
