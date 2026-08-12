import OpenAI from "openai";
import type { BrainAdapter, BrainContext, BrainReply } from "@leah/shared";
import { parseReply } from "./anthropic.js";

/**
 * OpenAI GPT-4o as the "brain". The brief flags GPT-4o Realtime for very natural
 * voice delivery and tight brain+mouth integration. This adapter uses the text
 * Chat Completions API so it can be compared apples-to-apples against Claude on
 * transcript quality and grounding; swap to the Realtime API when wiring live
 * voice (that path bundles the mouth, like Nova Sonic).
 */
export interface OpenAIBrainConfig {
  /** Model id, e.g. "gpt-4o". */
  model?: string;
  name?: string;
  apiKey?: string;
}

const REPLY_JSON_SCHEMA = {
  name: "leah_reply",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      say: { type: "string" },
      used_doc_ids: { type: "array", items: { type: "string" } },
      next_stage: {
        type: "string",
        enum: ["rapport", "targeted_education", "objection_handling", "close"],
      },
      needs_human: { type: "boolean" },
    },
    required: ["say", "used_doc_ids", "next_stage", "needs_human"],
  },
} as const;

export class OpenAIBrain implements BrainAdapter {
  readonly id = "gpt-4o-realtime" as const;
  readonly name: string;
  readonly model: string;
  private readonly client: OpenAI;

  constructor(config: OpenAIBrainConfig = {}) {
    this.model = config.model ?? "gpt-4o";
    this.name = config.name ?? "GPT-4o";
    this.client = new OpenAI(config.apiKey ? { apiKey: config.apiKey } : {});
  }

  async generateReply(context: BrainContext): Promise<BrainReply> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: context.systemPrompt },
      ...context.history.map((m) =>
        m.role === "leah"
          ? ({ role: "assistant", content: m.text } as const)
          : ({ role: "user", content: m.text } as const),
      ),
    ];

    const response = await this.client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      messages,
      response_format: { type: "json_schema", json_schema: REPLY_JSON_SCHEMA },
    });

    const parsed = parseReply(response.choices[0]?.message?.content ?? "");

    return {
      text: parsed.say,
      citedDocIds: parsed.used_doc_ids,
      suggestedStage: parsed.next_stage,
      wantsHumanHandoff: parsed.needs_human,
      usage: {
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }
}
