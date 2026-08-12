import type { BrainId } from "./call.js";
import type { RetrievedChunk } from "./knowledge.js";

/**
 * The approved conversation structure (set B). Leah moves through these stages
 * rather than improvising a sales approach.
 */
export type ConversationStage =
  | "rapport"
  | "targeted_education"
  | "objection_handling"
  | "close";

/** A message in the running conversation, in the brain's terms. */
export interface ConversationMessage {
  role: "leah" | "patient";
  text: string;
}

/** Everything the engine hands a brain to produce the next reply. */
export interface BrainContext {
  /** The condition in scope — bounds retrieval and the system prompt. */
  condition: string;
  stage: ConversationStage;
  history: ConversationMessage[];
  /** Facts retrieved from set A for this turn (the only allowed clinical source). */
  specialtyContext: RetrievedChunk[];
  /** Approach retrieved from set B for this turn (the only allowed persuasion source). */
  conversionContext: RetrievedChunk[];
  /** Fully-assembled system prompt. */
  systemPrompt: string;
}

/** Token usage for a single brain call — drives the per-minute/per-call cost axis. */
export interface BrainUsage {
  inputTokens: number;
  outputTokens: number;
}

/** The brain's structured reply. */
export interface BrainReply {
  text: string;
  /** Docs the brain says it used — cross-checked by the guardrails. */
  citedDocIds: string[];
  /** The brain's read on where the conversation should go next. */
  suggestedStage?: ConversationStage;
  /** True if the brain determined this needs a human. */
  wantsHumanHandoff?: boolean;
  /** Tokens consumed producing this reply, when the provider reports them. */
  usage?: BrainUsage;
}

/**
 * The pluggable "brain". Implementations: Claude (Opus / Sonnet via one
 * adapter), OpenAI GPT-4o, Nova Sonic. Built so the team can run the same
 * script through each and compare — see packages/voice/src/eval.
 */
export interface BrainAdapter {
  /** Provider family, used for storage and dashboard grouping. */
  readonly id: BrainId;
  /** Human label for reports, e.g. "Claude Opus 5" or "GPT-4o". */
  readonly name: string;
  /** The exact model id the adapter calls, e.g. "claude-opus-5". */
  readonly model: string;
  generateReply(context: BrainContext): Promise<BrainReply>;
}
