import assert from "node:assert/strict";
import { test } from "node:test";
import { createKnowledgeBase } from "@leah/knowledge-base";
import { parseReply } from "../brains/anthropic.js";
import { MockBrain } from "../brains/mock.js";
import { MockJudge } from "./judge.js";
import { compareBrains } from "./compare.js";
import { renderMarkdown } from "./report.js";
import { estimateCost } from "./pricing.js";

test("parseReply reads a clean structured reply", () => {
  const r = parseReply(
    JSON.stringify({
      say: "Hello there.",
      used_doc_ids: ["specialty/varicose-veins/procedure-overview"],
      next_stage: "close",
      needs_human: false,
    }),
  );
  assert.equal(r.say, "Hello there.");
  assert.deepEqual(r.used_doc_ids, ["specialty/varicose-veins/procedure-overview"]);
  assert.equal(r.next_stage, "close");
  assert.equal(r.needs_human, false);
});

test("parseReply strips a ```json fence", () => {
  const r = parseReply('```json\n{"say":"Hi","used_doc_ids":[],"next_stage":"rapport","needs_human":true}\n```');
  assert.equal(r.say, "Hi");
  assert.equal(r.needs_human, true);
});

test("parseReply falls back to raw text on invalid JSON", () => {
  const r = parseReply("I have Tuesday at 2:15 — does that work?");
  assert.match(r.say, /Tuesday/);
  assert.equal(r.needs_human, false);
});

test("estimateCost uses the price table and returns null for unknown models", () => {
  // 1M input + 1M output on Opus 5 = $5 + $25 = $30.
  assert.equal(estimateCost("claude-opus-5", 1_000_000, 1_000_000), 30);
  assert.equal(estimateCost("no-such-model", 1000, 1000), null);
});

test("compareBrains runs the full pipeline and produces a rankable report", async () => {
  const { retriever } = createKnowledgeBase();
  const brains = [new MockBrain("Brain A"), new MockBrain("Brain B")];
  const report = await compareBrains(retriever, brains, new MockJudge());

  assert.equal(report.brains.length, 2);
  for (const b of report.brains) {
    assert.equal(b.results.length, report.scenarios.length);
    assert.ok(b.overall > 0 && b.overall <= 5);
    assert.equal(b.errored, false);
  }
  // The markdown renders without throwing and contains the summary table.
  const md = renderMarkdown(report, "test-stamp");
  assert.match(md, /## Summary/);
  assert.match(md, /Brain A/);
});
