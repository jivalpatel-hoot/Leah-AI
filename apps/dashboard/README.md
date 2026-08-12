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

All data comes from `lib/mock-data.ts`, typed with `@leah/shared`. The metrics
are computed by the shared `computeMetrics()` so the dashboard and any report
agree. To go live, replace `getPatients()` / `getCalls()` with reads from the
real call/outcome store — no page changes needed.

> Styling is plain CSS (`app/globals.css`) rather than Tailwind, to keep the
> install light and the build dependency-free. Swap in Tailwind later if the
> team prefers.

## TODO before pilot

- [ ] Back `lib/mock-data.ts` with the real data store (call transcripts are PHI).
- [ ] Add auth (internal-only).
- [ ] Let reviewers clear flags and mark calls reviewed from the UI.
- [ ] Add charts + date/brain/outcome filtering once volume is meaningful.
