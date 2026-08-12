import assert from "node:assert/strict";
import { test } from "node:test";
import type { BrainReply, RetrievedChunk } from "@leah/shared";
import { checkReply } from "./guardrails.js";

const emptyReply = (over: Partial<BrainReply> = {}): BrainReply => ({
  text: "",
  citedDocIds: [],
  ...over,
});

const chunk = (docId: string): RetrievedChunk => ({
  docId,
  set: "specialty",
  condition: "varicose-veins",
  title: docId,
  text: "…",
  score: 1,
  version: 1,
});

test("flags overstated outcomes", () => {
  const flags = checkReply({
    reply: emptyReply({ text: "It's a completely painless, risk-free procedure." }),
    specialtyContext: [],
  });
  assert.ok(flags.some((f) => f.type === "overstated_outcome"));
});

test("flags manufactured urgency", () => {
  const flags = checkReply({
    reply: emptyReply({ text: "Only a few spots left this week, so act now!" }),
    specialtyContext: [],
  });
  assert.ok(flags.some((f) => f.type === "manufactured_urgency"));
});

test("does not flag a clean, grounded reply", () => {
  const flags = checkReply({
    reply: emptyReply({
      text: "The consultation is a no-obligation way to get your questions answered.",
      citedDocIds: ["specialty/varicose-veins/procedure-overview"],
    }),
    specialtyContext: [chunk("specialty/varicose-veins/procedure-overview")],
    factualQuestion: true,
  });
  assert.equal(flags.length, 0);
});

test("flags a factual question with no set A retrieval", () => {
  const flags = checkReply({
    reply: emptyReply({ text: "Recovery is about two days." }),
    specialtyContext: [],
    factualQuestion: true,
  });
  assert.ok(flags.some((f) => f.type === "low_confidence_retrieval"));
});

test("flags citations to docs not retrieved this turn", () => {
  const flags = checkReply({
    reply: emptyReply({
      text: "As our materials say…",
      citedDocIds: ["specialty/varicose-veins/side-effects"],
    }),
    specialtyContext: [chunk("specialty/varicose-veins/procedure-overview")],
  });
  assert.ok(flags.some((f) => f.type === "off_knowledge_base"));
});

test("records a human handoff", () => {
  const flags = checkReply({
    reply: emptyReply({ text: "Let me connect you with the team.", wantsHumanHandoff: true }),
    specialtyContext: [],
  });
  assert.ok(flags.some((f) => f.type === "human_handoff"));
});
