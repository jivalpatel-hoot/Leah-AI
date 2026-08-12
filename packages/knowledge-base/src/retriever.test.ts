import assert from "node:assert/strict";
import { test } from "node:test";
import { createKnowledgeBase } from "./index.js";
import { loadAllDocs, unapprovedSpecialtyDocs } from "./loader.js";

test("loads all sample docs without throwing", () => {
  const docs = loadAllDocs();
  assert.ok(docs.length >= 10, `expected >=10 docs, got ${docs.length}`);
  assert.ok(docs.some((d) => d.set === "specialty"));
  assert.ok(docs.some((d) => d.set === "conversion"));
});

test("retrieves the cost doc from set A for a cost question", async () => {
  const { retriever } = createKnowledgeBase();
  const chunks = await retriever.retrieve({
    set: "specialty",
    condition: "varicose-veins",
    text: "how much does this cost with insurance",
    topK: 3,
  });
  assert.ok(chunks.length > 0);
  assert.equal(chunks[0]!.docId, "specialty/varicose-veins/cost-and-insurance");
});

test("set B 'general' playbook docs apply to a specific condition", async () => {
  const { retriever } = createKnowledgeBase();
  const chunks = await retriever.retrieve({
    set: "conversion",
    condition: "varicose-veins",
    text: "objection handling cost hesitation",
    topK: 3,
  });
  assert.ok(chunks.some((c) => c.condition === "general"));
});

test("never returns set B content when asking set A", async () => {
  const { retriever } = createKnowledgeBase();
  const chunks = await retriever.retrieve({
    set: "specialty",
    condition: "varicose-veins",
    text: "objection cost close appointment",
    topK: 5,
  });
  assert.ok(chunks.every((c) => c.set === "specialty"));
});

test("sample specialty docs are correctly reported as unapproved", () => {
  const docs = loadAllDocs();
  const unapproved = unapprovedSpecialtyDocs(docs);
  // All the seeded set A docs are placeholders pending physician sign-off.
  assert.ok(unapproved.length > 0);
});
