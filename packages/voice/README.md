# @leah/voice

Leah's conversation engine, guardrails, and the swappable **brain** and **mouth**
adapters (workstream 1 of the brief).

## The two separable parts

The brief insists the **brain** (reasoning) and **mouth** (voice) be evaluated
separately even if a platform bundles them. The code mirrors that:

- **`BrainAdapter`** (`@leah/shared`) — the reasoning engine. Implementations:
  `AnthropicBrain` (Claude — drives both Opus and Sonnet via its `model`),
  `OpenAIBrain` (GPT-4o), `NovaSonicBrain` (stub), and a working `MockBrain`.
- **`VoiceAdapter`** (`src/voice/adapter.ts`) — TTS/STT/turn-taking. Implementations:
  `VapiAdapter`, `RetellAdapter`, `BlandAdapter`. Not needed with Nova Sonic,
  which is speech-to-speech (brain *is* mouth).

Because both are interfaces, the side-by-side test the brief asks for — "run the
same script through at least two of these and compare transcripts" — is a matter
of swapping which adapter you hand `LeahEngine`. That test is built and runnable:
see **[`EVAL.md`](EVAL.md)** and `npm run compare -w packages/voice`.

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

## The brains

`AnthropicBrain` (Claude) and `OpenAIBrain` (GPT-4o) are wired to their
providers' APIs and use **structured outputs**, so each reply carries the spoken
line *plus* the set A doc ids it drew from — which the guardrails cross-check.
`MockBrain` is a working, keyless reference implementation showing the exact
`BrainReply` shape. `NovaSonicBrain` is a stub (speech-to-speech via Bedrock).

**Pilot default:** `createDefaultBrain()` returns the chosen pilot brain —
**Claude Sonnet 5**, low-effort for voice latency (guardrails are enforced in
code regardless). Override with the `LEAH_BRAIN_MODEL` env var or an argument.
Rationale in [`EVAL.md`](EVAL.md); confirm it with the comparison harness.

API keys come from env (`.env`, never committed) — see `.env.example`.

## Runtime — driving a live call

`LeahConversation` (`src/runtime/`) turns the engine into an actual call: feed it
each patient utterance, it runs the RAG turn, builds the transcript with
citations, accumulates guardrail flags, tracks the stage, and on `end()` returns
a finished `Call` — the exact record the dashboard renders. A `CallStore`
(in-memory or JSON file) persists it.

```ts
const convo = new LeahConversation({ callId, patient, engine, brain: "claude", voice: "vapi" });
const reply = await convo.handleUtterance("What does this cost?"); // Leah's line
// ...more turns...
await store.save(convo.end());
```

To go live, hand `convo.handleUtterance` to a `VoiceAdapter` as its
`onPatientUtterance` handler and call `end()` from `onCallEnded`.

## Comparing brains

To pick the LLM, run the same scenarios through each candidate and score the
transcripts on grounding, tone, scope, and safety — plus flags, latency, and
cost. See **[`EVAL.md`](EVAL.md)**:

```bash
ANTHROPIC_API_KEY=... OPENAI_API_KEY=... npm run compare -w packages/voice
# or, keyless: LEAH_EVAL_DRY=1 npm run compare -w packages/voice
```
