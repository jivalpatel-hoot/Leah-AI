# @leah/dashboard

The internal web app over the pilot's call data (workstream 4). Next.js
(App Router) + TypeScript. It runs today on mock data.

> The brief is explicit that the complexity lives in the knowledge base and
> conversation design, not here — so this starts as a **basic table view** and
> adds charts/filtering once the pilot has volume.

## What it shows (all from the brief)

| Page | Shows |
|------|-------|
| **Overview** (`/`) | Conversion rate (booked ÷ accepted), offered/yes/no, booked, follow-ups, escalations, flagged count, and a table of every call. |
| **Leads & offers** (`/leads`) | Who was offered Leah and who said yes / no, with the resulting call outcome. |
| **Call detail** (`/calls/[id]`) | Full transcript with per-turn **citations** back to the knowledge-base doc, the outcome, the appointment, and any flags. |
| **Flagged calls** (`/flagged`) | Everything where Leah may have gone off the approved knowledge base, tripped a guardrail, or handed off — for the 100% human review. |

## Run

```bash
npm install          # from the repo root (workspaces)
npm run dev          # or: npm run dev --workspace apps/dashboard
# http://localhost:3000
```

## Data

`lib/data.ts` is the single data source. It reads **real** finished calls from
the runtime's JSON store (`data/calls.json` + `data/patients.json`, matching
`@leah/voice`'s `JsonFileCallStore`) when those files exist, and otherwise falls
back to the bundled **sample data** in `lib/mock-data.ts` so the app always
renders. A badge on the overview shows which one is live. Point it elsewhere
with `LEAH_DATA_DIR`. Metrics come from the shared `computeMetrics()` so the
dashboard and any report agree.

**See the live path end-to-end, no keys needed:**

```bash
npm run seed -w packages/voice   # drives mock calls through the runtime → data/
npm run dev  -w apps/dashboard   # overview now shows "live data"
```

The pages that read the store are `force-dynamic`, so new calls appear on
refresh without a rebuild. The calls table (`components/CallsTable.tsx`) is a
client component with outcome / brain / review-status filters — table-first, per
the brief; charts come once volume is meaningful.

> Styling is plain CSS (`app/globals.css`) rather than Tailwind, to keep the
> install light and the build dependency-free. Swap in Tailwind later if the
> team prefers.

## TODO before pilot

- [ ] Swap the JSON store for the production datastore (transcripts are PHI).
- [ ] Add auth (internal-only).
- [ ] Let reviewers clear flags and mark calls reviewed from the UI (write path).
- [ ] Add charts + date-range filtering once volume is meaningful.
