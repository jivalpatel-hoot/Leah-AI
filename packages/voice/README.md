# @leah/voice

Leah's conversation engine, guardrails, and the swappable **brain** and **mouth**
adapters (workstream 1 of the brief).

## The two separable parts

The brief insists the **brain** (reasoning) and **mouth** (voice) be evaluated
separately even if a platform bundles them. The code mirrors that:

- **`BrainAdapter`** (`@leah/shared`) — the reasoning engine. Implementations:
  `ClaudeBrain`, `GPT4oBrain`, `NovaSonicBrain`, and a working `MockBrain`.
- **`VoiceAdapter`** (`src/voice/adapter.ts`) — TTS/STT/turn-taking. Implementations:
  `VapiAdapter`, `RetellAdapter`, `BlandAdapter`. Not needed with Nova Sonic,
  which is speech-to-speech (brain *is* mouth).

Because both are interfaces, the side-by-side test the brief asks for — "run the
same script through at least two of these and compare transcripts" — is a matter
of swapping which adapter you hand `LeahEngine`.

## LeahEngine — one turn

```ts
import { LeahEngine, MockBrain } from "@leah/voice";
import { createKnowledgeBase } from "@leah/knowledge-base";

const { retriever } = createKnowledgeBase();
const engine = new LeahEngine({ retriever, brain: new MockBrain() });

const result = await engine.runTurn({
  condition: "varicose-veins",
  stage: "objection_handling",
  history: [],
  patientMessage: "I'm worried it'll be really expensive.",
});

result.reply.text;   // what Leah says
result.turn.citations; // which set A docs it traces to
result.flags;        // guardrail flags for human review
```

Each turn:

```
retrieve set A + set B  →  buildSystemPrompt()  →  brain.generateReply()
                        →  checkReply() guardrails  →  citable transcript turn
```

## Guardrails

`checkReply()` enforces the hard rules from set B's `guardrails.md` in code, and
returns flags instead of throwing — the pilot lets calls through but routes
anything suspicious to the 100% human review. It flags:

- `overstated_outcome` — "painless", "risk-free", "guaranteed", "cure", …
- `manufactured_urgency` — "spots filling up", "offer expires", …
- `human_handoff` — the brain asked for a human
- `low_confidence_retrieval` — a factual question with no set A content retrieved
- `off_knowledge_base` — reply cited set A docs that weren't retrieved

## Wiring a real brain

`MockBrain` shows the exact `BrainReply` shape a real adapter must return
(`text`, `citedDocIds`, `suggestedStage`, `wantsHumanHandoff`). Each real
adapter has a `TODO` marking where the API call goes. API keys come from env
(`.env`, never committed) — see `.env.example`.
