import Anthropic from "@anthropic-ai/sdk";
import type {
  BrainAdapter,
  BrainContext,
  BrainReply,
  ConversationStage,
} from "@leah/shared";

/**
 * Claude as the "brain", via the Anthropic Messages API. One adapter drives the
 * whole Claude side of the comparison — pass `model: "claude-opus-5"` for Opus
 * and `model: "claude-sonnet-5"` for Sonnet; nothing else changes.
 *
 * The brief picks Claude first for testing conversation quality and safety
 * because it stays inside guardrails well. This adapter reinforces that: it uses
 * structured outputs so the model must return the spoken line *and* the set A
 * doc ids it drew from, which the engine's guardrails then cross-check.
 */
export interface AnthropicBrainConfig {
  /** Model id, e.g. "claude-opus-5" or "claude-sonnet-5". */
  model: string;
  /** Display label for reports. Defaults to the model id. */
  name?: string;
  apiKey?: string;
  /** Reasoning depth. Lower = cheaper/faster; "medium" is a fair default. */
  effort?: "low" | "medium" | "high" | "xhigh" | "max";
  maxTokens?: number;
}

/** JSON schema Leah's reply must match — same shape across every brain. */
const REPLY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    say: {
      type: "string",
      description: "What Leah says next to the patient, spoken aloud.",
    },
    used_doc_ids: {
      type: "array",
      items: { type: "string" },
      description:
        "Ids of the APPROVED CLINICAL FACTS (set A) documents this reply drew any factual claim from. Empty if none.",
    },
    next_stage: {
      type: "string",
      enum: ["rapport", "targeted_education", "objection_handling", "close"],
    },
    needs_human: {
      type: "boolean",
      description:
        "True if the patient needs something outside the approved material and should be handed to a human.",
    },
  },
  required: ["say", "used_doc_ids", "next_stage", "needs_human"],
} as const;

export class AnthropicBrain implements BrainAdapter {
  readonly id = "claude" as const;
  readonly name: string;
  readonly model: string;
  private readonly client: Anthropic;
  private readonly effort: string;
  private readonly maxTokens: number;

  constructor(config: AnthropicBrainConfig) {
    this.model = config.model;
    this.name = config.name ?? config.model;
    this.effort = config.effort ?? "medium";
    this.maxTokens = config.maxTokens ?? 2048;
    this.client = new Anthropic(config.apiKey ? { apiKey: config.apiKey } : {});
  }

  async generateReply(context: BrainContext): Promise<BrainReply> {
    const messages = context.history.map((m) => ({
      role: m.role === "leah" ? ("assistant" as const) : ("user" as const),
      content: m.text,
    }));

    // Beta/typed-lagging fields (output_config, effort, adaptive thinking) are
    // passed through untyped — see the claude-api skill's SDK-typing note.
    const params = {
      model: this.model,
      max_tokens: this.maxTokens,
      system: context.systemPrompt,
      thinking: { type: "adaptive" },
      output_config: {
        effort: this.effort,
        format: { type: "json_schema", schema: REPLY_SCHEMA },
      },
      messages,
    };

    const response = await (this.client.messages.create as (p: unknown) => Promise<{
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    }>)(params);

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");
    const parsed = parseReply(text);

    return {
      text: parsed.say,
      citedDocIds: parsed.used_doc_ids,
      suggestedStage: parsed.next_stage,
      wantsHumanHandoff: parsed.needs_human,
      usage: {
        inputTokens: response.usage?.input_tokens ?? 0,
        outputTokens: response.usage?.output_tokens ?? 0,
      },
    };
  }
}

interface ParsedReply {
  say: string;
  used_doc_ids: string[];
  next_stage: ConversationStage;
  needs_human: boolean;
}

/** Parse the structured JSON reply, tolerating minor wrapping. */
export function parseReply(text: string): ParsedReply {
  let raw = text.trim();
  // Strip a ```json fence if the model added one despite structured output.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(raw);
  if (fence) raw = fence[1]!.trim();
  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    // Last resort: treat the whole thing as the spoken line so the call survives.
    return { say: text.trim(), used_doc_ids: [], next_stage: "targeted_education", needs_human: false };
  }
  const stage = obj.next_stage as ConversationStage;
  return {
    say: typeof obj.say === "string" ? obj.say : "",
    used_doc_ids: Array.isArray(obj.used_doc_ids)
      ? (obj.used_doc_ids.filter((x) => typeof x === "string") as string[])
      : [],
    next_stage: ["rapport", "targeted_education", "objection_handling", "close"].includes(stage)
      ? stage
      : "targeted_education",
    needs_human: obj.needs_human === true,
  };
}
