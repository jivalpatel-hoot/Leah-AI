import type { BrainAdapter, Retriever } from "@leah/shared";
import type { Scenario } from "./scenarios.js";
import { SCENARIOS } from "./scenarios.js";
import { runScenario, type ScenarioRun } from "./runner.js";
import { RUBRIC, type Judge, type JudgeResult, type RubricKey } from "./judge.js";
import { estimateCost } from "./pricing.js";

export interface ScenarioResult {
  scenario: Scenario;
  run: ScenarioRun;
  judged: JudgeResult;
}

export interface BrainSummary {
  name: string;
  model: string;
  results: ScenarioResult[];
  /** Mean of each rubric dimension across all scenarios. */
  avgScores: Record<RubricKey, number>;
  /** Mean overall score across scenarios. */
  overall: number;
  openFlags: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Estimated USD for the whole comparison run, or null if price unknown. */
  estCost: number | null;
  avgLatencyMs: number;
  errored: boolean;
}

export interface ComparisonReport {
  scenarios: Scenario[];
  brains: BrainSummary[];
  judgeName: string;
}

/**
 * Run every brain through every scenario, judge each transcript, and aggregate.
 * This is the whole side-by-side: same script, same retrieval, same rubric —
 * only the brain changes. Brains run sequentially to keep provider rate limits
 * and log output sane; scenarios within a brain are also sequential so latency
 * numbers aren't skewed by concurrency.
 */
export async function compareBrains(
  retriever: Retriever,
  brains: BrainAdapter[],
  judge: Judge,
  scenarios: Scenario[] = SCENARIOS,
  onProgress?: (msg: string) => void,
): Promise<ComparisonReport> {
  const summaries: BrainSummary[] = [];

  for (const brain of brains) {
    onProgress?.(`Running ${brain.name} (${brain.model})…`);
    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      const run = await runScenario(retriever, brain, scenario);
      const judged = await judge.score(scenario, run);
      results.push({ scenario, run, judged });
      onProgress?.(`  ${scenario.id}: overall ${judged.overall.toFixed(1)}/5${run.errored ? " (errored)" : ""}`);
    }

    summaries.push(summarize(brain.name, brain.model, results));
  }

  return { scenarios, brains: summaries, judgeName: judge.name };
}

function summarize(name: string, model: string, results: ScenarioResult[]): BrainSummary {
  const avgScores = Object.fromEntries(
    RUBRIC.map((r) => [r.key, mean(results.map((x) => x.judged.scores[r.key]))]),
  ) as Record<RubricKey, number>;

  const allTurns = results.flatMap((r) => r.run.turns);
  const totalInputTokens = allTurns.reduce((n, t) => n + t.inputTokens, 0);
  const totalOutputTokens = allTurns.reduce((n, t) => n + t.outputTokens, 0);
  const latencies = allTurns.map((t) => t.latencyMs);

  return {
    name,
    model,
    results,
    avgScores,
    overall: mean(results.map((r) => r.judged.overall)),
    openFlags: allTurns.flatMap((t) => t.flags).filter((f) => f.open).length,
    totalInputTokens,
    totalOutputTokens,
    estCost: estimateCost(model, totalInputTokens, totalOutputTokens),
    avgLatencyMs: mean(latencies),
    errored: results.some((r) => r.run.errored),
  };
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
