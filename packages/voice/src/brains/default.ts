import type { BrainAdapter } from "@leah/shared";
import { AnthropicBrain } from "./anthropic.js";

/**
 * The pilot brain. Claude Sonnet 5, chosen for the pilot because Leah's job is
 * to follow a bounded, RAG-grounded script — the dominant risk is a model
 * asserting an unapproved clinical claim or breaking character, not reasoning
 * depth. Sonnet 5 gives ~Opus-level guardrail adherence at roughly half the
 * cost and lower latency, which matters for real-time voice.
 *
 * This is a reasoned default, to be confirmed by the comparison harness
 * (`npm run compare`). Opus 5 stays available as the judge and as a fallback for
 * genuinely hard turns; Nova Sonic is the cost/scale track once quality holds.
 * See EVAL.md for the full rationale.
 */
export const PILOT_BRAIN_MODEL = "claude-sonnet-5";

export interface DefaultBrainOptions {
  /** Override the model, e.g. to A/B against "claude-opus-5". */
  model?: string;
  /** Effort/latency tradeoff. "low" keeps voice turns snappy; guardrails are
   *  enforced in code regardless, so low effort is safe here. Raise to "medium"
   *  if you want the model to deliberate more. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  apiKey?: string;
}

/**
 * Build the production/pilot brain. Prefers an explicit model, then the
 * LEAH_BRAIN_MODEL env override, then the pilot default (Sonnet 5).
 */
export function createDefaultBrain(options: DefaultBrainOptions = {}): BrainAdapter {
  const model = options.model ?? process.env.LEAH_BRAIN_MODEL ?? PILOT_BRAIN_MODEL;
  return new AnthropicBrain({
    model,
    name: `Leah pilot brain (${model})`,
    effort: options.effort ?? "low",
    apiKey: options.apiKey,
  });
}
