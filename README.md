# Leah — Hoot Specialty Care AI Voice Agent

Leah is an AI voice agent for specialty medical practices. She reaches out to
patients who have been offered an AI-assisted conversation, educates them from
**doctor-approved** material, handles objections using an **approved playbook**,
and books concrete next steps — all while staying inside strict clinical and
legal guardrails.

This repository is a **monorepo scaffold**. It lays out every workstream from
the project brief so the team can build them in parallel. Most packages ship
with working interfaces + stubs and clearly marked `TODO`s where real
integrations, credentials, and doctor-approved content go.

## The four workstreams

| # | Workstream | Package | Status |
|---|------------|---------|--------|
| 1 | **The brain & mouth** — LLM reasoning + voice delivery | [`packages/voice`](packages/voice) | Interfaces + adapter stubs |
| 2 | **The knowledge base** — the part that matters most: two separate, auditable document sets fed to the model as RAG | [`packages/knowledge-base`](packages/knowledge-base) | Retrieval layer + one sample condition |
| 3 | **The conversion playbook** — conversation structure + objection library | [`packages/knowledge-base/content/conversion`](packages/knowledge-base/content/conversion) | Sample playbook |
| 4 | **The dashboard** — internal web app over the call data | [`apps/dashboard`](apps/dashboard) | Runnable Next.js app on mock data |
| — | **Shared domain model** — types every package agrees on | [`packages/shared`](packages/shared) | Complete |

## Architecture at a glance

```
                    ┌─────────────────────────────────────────┐
                    │              packages/voice              │
   patient  ◄──────►│  VoiceAdapter (Vapi / Retell / Bland /   │
   (phone)          │                Nova Sonic built-in)      │
                    │                    │                     │
                    │              turn text                   │
                    │                    ▼                     │
                    │  LeahEngine ── system prompt + guardrails│
                    │                    │                     │
                    │              BrainAdapter                │
                    │       (Claude / GPT-4o / Nova Sonic)     │
                    └──────────┬──────────────────┬────────────┘
                               │                  │
                        retrieval(query)     call events
                               ▼                  ▼
                 ┌────────────────────┐  ┌────────────────────┐
                 │ packages/          │  │  data store        │
                 │ knowledge-base     │  │  (calls, outcomes, │
                 │  A. specialty      │  │   flags)           │
                 │  B. conversion     │  └─────────┬──────────┘
                 └────────────────────┘            │
                                                   ▼
                                        ┌────────────────────┐
                                        │  apps/dashboard     │
                                        │  (Next.js)          │
                                        └────────────────────┘
```

Two design commitments run through the whole scaffold:

1. **Everything Leah asserts traces back to something a human wrote.** Clinical
   facts come only from knowledge-base **set A**; persuasion tactics come only
   from **set B**. The model does the *understanding and phrasing*, never the
   *source of truth*.
2. **Every call is auditable.** Each transcript turn can cite the document it
   drew from, and anything outside the approved sets is flagged for human review.

## Repository layout

```
Leah-AI/
├─ apps/
│  └─ dashboard/            # Next.js + TypeScript internal web app (workstream 4)
├─ packages/
│  ├─ shared/               # Domain types shared by every package
│  ├─ knowledge-base/       # RAG content + retrieval (workstreams 2 & 3)
│  │  └─ content/
│  │     ├─ specialty/      # SET A — doctor-approved clinical facts
│  │     └─ conversion/     # SET B — approved persuasion playbook
│  └─ voice/                # Leah engine, brain adapters, voice adapters (workstream 1)
├─ package.json             # npm workspaces root
└─ tsconfig.base.json
```

## Getting started

```bash
npm install            # installs all workspaces
npm run dev            # runs the dashboard on http://localhost:3000
```

See each package's own `README.md` for details and the `TODO`s that block the
pilot.

## Next steps (from the brief)

- **Ruhi / Jival:** stand up a side-by-side test of Claude, GPT-4o Realtime, and
  Nova 2 Sonic using the same script. The `BrainAdapter` interface in
  `packages/voice` is built for exactly this swap.
- **Riya + doctor:** draft the first specialty knowledge base and objection
  library for one condition. Drop them into `packages/knowledge-base/content`.
- **Team:** the RAG architecture keeps set A and set B separate and auditable by
  construction — see `packages/knowledge-base`.
- **Dashboard** runs today on mock data; wire it to the real data store as calls
  come in.
- **Pilot** on one condition, small volume, 100% human-reviewed transcripts.
