import type {
  BrainAdapter,
  CallFlag,
  ConversationMessage,
  Retriever,
} from "@leah/shared";
import { LeahEngine } from "../engine.js";
import type { Scenario } from "./scenarios.js";

/** One Leah turn as produced during a run, with everything the judge needs. */
export interface RunTurn {
  stage: string;
  patient: string;
  leah: string;
  citedDocIds: string[];
  flags: CallFlag[];
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

/** The full result of running one brain through one scenario. */
export interface ScenarioRun {
  brainName: string;
  model: string;
  scenarioId: string;
  turns: RunTurn[];
  /** True if the brain threw partway (e.g. missing key, API error). */
  errored: boolean;
  error?: string;
}

/**
 * Drive one brain through one scenario's scripted turns, accumulating the
 * conversation history so each reply is produced in real context. Retrieval,
 * prompt assembly, and guardrails all run per turn via LeahEngine — so this
 * exercises the whole RAG pipeline, not just the raw model.
 */
export async function runScenario(
  retriever: Retriever,
  brain: BrainAdapter,
  scenario: Scenario,
): Promise<ScenarioRun> {
  const engine = new LeahEngine({ retriever, brain });
  const history: ConversationMessage[] = [];
  const turns: RunTurn[] = [];

  for (const scripted of scenario.turns) {
    history.push({ role: "patient", text: scripted.patientMessage });
    const start = monotonicMs();
    try {
      const result = await engine.runTurn({
        condition: scenario.condition,
        stage: scripted.stage,
        history,
        patientMessage: scripted.patientMessage,
        factualQuestion: scripted.factualQuestion,
      });
      const latencyMs = monotonicMs() - start;
      history.push({ role: "leah", text: result.reply.text });
      turns.push({
        stage: scripted.stage,
        patient: scripted.patientMessage,
        leah: result.reply.text,
        citedDocIds: result.reply.citedDocIds,
        flags: result.flags,
        latencyMs,
        inputTokens: result.reply.usage?.inputTokens ?? 0,
        outputTokens: result.reply.usage?.outputTokens ?? 0,
      });
    } catch (err) {
      return {
        brainName: brain.name,
        model: brain.model,
        scenarioId: scenario.id,
        turns,
        errored: true,
        error: (err as Error).message,
      };
    }
  }

  return {
    brainName: brain.name,
    model: brain.model,
    scenarioId: scenario.id,
    turns,
    errored: false,
  };
}

// Date.now() is unavailable in some sandboxes; performance.now is safe and is
// what we want for latency anyway.
function monotonicMs(): number {
  return typeof performance !== "undefined" ? performance.now() : 0;
}
