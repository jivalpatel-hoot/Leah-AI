/**
 * End-to-end smoke test of the Leah pipeline with no API keys:
 *   real knowledge base  →  retrieval  →  system prompt  →  MockBrain  →  guardrails
 *
 * Run from the repo root:
 *   node --experimental-strip-types packages/voice/examples/demo.ts
 */
import { createKnowledgeBase } from "@leah/knowledge-base";
import { LeahEngine, MockBrain } from "@leah/voice";
import type { ConversationStage } from "@leah/shared";

const { retriever, docs } = createKnowledgeBase();
console.log(`Loaded ${docs.length} knowledge docs.`);

const engine = new LeahEngine({ retriever, brain: new MockBrain() });

const script: Array<{ stage: ConversationStage; patient: string; factual?: boolean }> = [
  { stage: "rapport", patient: "Hi, who is this?" },
  { stage: "targeted_education", patient: "What is the procedure like?", factual: true },
  { stage: "objection_handling", patient: "I'm worried about the cost." },
  { stage: "close", patient: "Okay, I'd like to book." },
];

for (const step of script) {
  const result = await engine.runTurn({
    condition: "varicose-veins",
    stage: step.stage,
    history: [],
    patientMessage: step.patient,
    factualQuestion: step.factual,
  });
  console.log(`\n[${step.stage}] patient: ${step.patient}`);
  console.log(`  leah: ${result.reply.text}`);
  console.log(
    `  cites: ${result.turn.citations?.map((c) => c.docId).join(", ") || "(none)"}`,
  );
  console.log(
    `  flags: ${result.flags.map((f) => f.type).join(", ") || "(none)"}`,
  );
}
