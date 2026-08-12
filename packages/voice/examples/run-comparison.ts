/**
 * Side-by-side brain comparison for Leah: Claude Opus vs Claude Sonnet vs OpenAI
 * GPT-4o, over the same scripted scenarios, same RAG pipeline, same rubric.
 *
 * Run from the repo root:
 *   ANTHROPIC_API_KEY=... OPENAI_API_KEY=... npm run compare -w packages/voice
 *
 * With no keys (or LEAH_EVAL_DRY=1) it runs a keyless DRY RUN using mock brains
 * and a heuristic judge, so the pipeline and report are verifiable offline.
 *
 * Writes a Markdown + JSON report to packages/voice/eval-results/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BrainAdapter, Retriever } from "@leah/shared";
import { createKnowledgeBase } from "@leah/knowledge-base";
import {
  AnthropicBrain,
  OpenAIBrain,
  MockBrain,
  AnthropicJudge,
  MockJudge,
  compareBrains,
  renderMarkdown,
  type Judge,
} from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "eval-results");

const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;
const dryRun = process.env.LEAH_EVAL_DRY === "1" || (!hasAnthropic && !hasOpenAI);

function buildBrains(): { brains: BrainAdapter[]; judge: Judge } {
  if (dryRun) {
    console.log("→ DRY RUN (no API keys): mock brains + heuristic judge.\n");
    return {
      brains: [
        new MockBrain("Claude Opus (mock)"),
        new MockBrain("Claude Sonnet (mock)"),
        new MockBrain("GPT-4o (mock)"),
      ],
      judge: new MockJudge(),
    };
  }

  const brains: BrainAdapter[] = [];
  if (hasAnthropic) {
    brains.push(new AnthropicBrain({ model: "claude-opus-5", name: "Claude Opus 5" }));
    brains.push(new AnthropicBrain({ model: "claude-sonnet-5", name: "Claude Sonnet 5" }));
  } else {
    console.log("⚠ ANTHROPIC_API_KEY not set — skipping the Claude brains.");
  }
  if (hasOpenAI) {
    brains.push(new OpenAIBrain({ model: "gpt-4o", name: "GPT-4o" }));
  } else {
    console.log("⚠ OPENAI_API_KEY not set — skipping the OpenAI brain.");
  }

  // Judge with Claude when available; otherwise fall back to the heuristic judge.
  const judge: Judge = hasAnthropic ? new AnthropicJudge({ model: "claude-opus-5" }) : new MockJudge();
  return { brains, judge };
}

async function main() {
  const { retriever }: { retriever: Retriever } = createKnowledgeBase();
  const { brains, judge } = buildBrains();

  if (brains.length === 0) {
    console.error("No brains to compare. Set ANTHROPIC_API_KEY and/or OPENAI_API_KEY.");
    process.exit(1);
  }

  console.log(`Comparing ${brains.length} brain(s), judged by ${judge.name}.\n`);
  const report = await compareBrains(retriever, brains, judge, undefined, (m) => console.log(m));

  const stamp = new Date().toISOString();
  const md = renderMarkdown(report, stamp);
  const slug = stamp.replace(/[:.]/g, "-");
  mkdirSync(OUT_DIR, { recursive: true });
  const mdPath = join(OUT_DIR, `comparison-${slug}.md`);
  const jsonPath = join(OUT_DIR, `comparison-${slug}.json`);
  writeFileSync(mdPath, md);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  console.log("\n=== Summary ===");
  const ranked = [...report.brains].sort((a, b) => Number(a.errored) - Number(b.errored) || b.overall - a.overall);
  for (const b of ranked) {
    const cost = b.estCost === null ? "n/a" : `$${b.estCost.toFixed(4)}`;
    console.log(
      `${b.name.padEnd(22)} overall ${b.overall.toFixed(2)}/5  flags ${b.openFlags}  ~${Math.round(b.avgLatencyMs)}ms/turn  ${cost}`,
    );
  }
  console.log(`\nReport written to:\n  ${mdPath}\n  ${jsonPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
