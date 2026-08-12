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

/** The brain's structured reply. */
export interface BrainReply {
  text: string;
  /** Docs the brain says it used — cross-checked by the guardrails. */
  citedDocIds: string[];
  /** The brain's read on where the conversation should go next. */
  suggestedStage?: ConversationStage;
  /** True if the brain determined this needs a human. */
  wantsHumanHandoff?: boolean;
}

/**
 * The pluggable "brain". Implementations: Claude, GPT-4o Realtime, Nova Sonic.
 * Built so the team can run the same script through each and compare.
 */
export interface BrainAdapter {
  readonly id: BrainId;
  generateReply(context: BrainContext): Promise<BrainReply>;
}
