# @leah/shared

The domain model every workstream agrees on. No runtime dependencies — pure
TypeScript types plus a couple of pure helper functions.

## What's here

| File | Purpose |
|------|---------|
| `knowledge.ts` | The two knowledge sets (A specialty / B conversion), `KnowledgeDoc`, and the `Retriever` interface the voice engine depends on. |
| `call.ts` | `Call`, `Patient`, `TranscriptTurn`, `CallOutcome`, `CallFlag`, `AppointmentProposal` — the shape of the data the dashboard renders and the pilot reviews. |
| `conversation.ts` | The `BrainAdapter` interface (Claude / GPT-4o / Nova Sonic are swappable behind it), `ConversationStage`, and `BrainContext`. |
| `metrics.ts` | `computeMetrics()` — one pure function so the dashboard and any report agree on the conversion rate. |

## Why a shared package

The knowledge base, the voice engine, and the dashboard are built by different
people in parallel. Pinning the domain types here keeps them honest: a change to
what a "flagged call" means is one edit, not three.
