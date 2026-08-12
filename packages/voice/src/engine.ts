import type {
  BrainAdapter,
  BrainReply,
  CallFlag,
  ConversationMessage,
  ConversationStage,
  Retriever,
  TranscriptTurn,
} from "@leah/shared";
import { buildSystemPrompt } from "./system-prompt.js";
import { checkReply } from "./guardrails.js";

export interface LeahEngineOptions {
  retriever: Retriever;
  brain: BrainAdapter;
  topK?: number;
}

export interface TurnInput {
  condition: string;
  stage: ConversationStage;
  history: ConversationMessage[];
  /** What the patient just said (the query that drives retrieval). */
  patientMessage: string;
  /** Hint that the patient asked a clinical/factual question this turn. */
  factualQuestion?: boolean;
}

export interface TurnResult {
  reply: BrainReply;
  flags: CallFlag[];
  /** A ready-to-append transcript turn for Leah, with citations attached. */
  turn: Omit<TranscriptTurn, "id" | "at">;
  nextStage: ConversationStage;
}

/**
 * LeahEngine ties the pieces together for one conversational turn:
 *   retrieve set A + set B  →  build system prompt  →  ask the brain  →
 *   run guardrails  →  return the reply, its flags, and a citable transcript turn.
 *
 * The brain and the retriever are both injected, so the same engine drives the
 * side-by-side comparison of Claude vs GPT-4o vs Nova Sonic and swaps retrieval
 * implementations without changes here.
 */
export class LeahEngine {
  private readonly retriever: Retriever;
  private readonly brain: BrainAdapter;
  private readonly topK: number;

  constructor(options: LeahEngineOptions) {
    this.retriever = options.retriever;
    this.brain = options.brain;
    this.topK = options.topK ?? 3;
  }

  async runTurn(input: TurnInput): Promise<TurnResult> {
    const [specialtyContext, conversionContext] = await Promise.all([
      this.retriever.retrieve({
        set: "specialty",
        condition: input.condition,
        text: input.patientMessage,
        topK: this.topK,
      }),
      this.retriever.retrieve({
        set: "conversion",
        condition: input.condition,
        text: `${input.stage} ${input.patientMessage}`,
        topK: this.topK,
      }),
    ]);

    const systemPrompt = buildSystemPrompt({
      condition: input.condition,
      stage: input.stage,
      specialtyContext,
      conversionContext,
    });

    const reply = await this.brain.generateReply({
      condition: input.condition,
      stage: input.stage,
      history: input.history,
      specialtyContext,
      conversionContext,
      systemPrompt,
    });

    const flags = checkReply({
      reply,
      specialtyContext,
      factualQuestion: input.factualQuestion,
    });

    return {
      reply,
      flags,
      nextStage: reply.suggestedStage ?? input.stage,
      turn: {
        role: "leah",
        text: reply.text,
        citations: specialtyContext
          .filter((c) => reply.citedDocIds.includes(c.docId))
          .map((c) => ({ docId: c.docId, set: c.set, version: c.version })),
      },
    };
  }
}
