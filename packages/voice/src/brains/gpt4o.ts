import type { BrainAdapter, BrainContext, BrainReply } from "@leah/shared";

export interface GPT4oBrainConfig {
  apiKey: string;
  model?: string;
}

/**
 * GPT-4o Realtime as the "brain" (and, in Realtime mode, the mouth too — brain
 * and voice are tightly integrated with low latency). Very natural delivery.
 *
 * TODO(voice): wire to the OpenAI Realtime API. Two integration shapes:
 *  - Text mode: use it like ClaudeBrain (text in, text out) with a separate
 *    voice platform.
 *  - Realtime speech-to-speech: GPT-4o handles audio directly; in that case the
 *    engine's system prompt + retrieved context are sent as the session
 *    instructions and the VoiceAdapter is the OpenAI Realtime transport itself.
 */
export class GPT4oBrain implements BrainAdapter {
  readonly id = "gpt-4o-realtime" as const;
  private readonly config: GPT4oBrainConfig;

  constructor(config: GPT4oBrainConfig) {
    this.config = config;
  }

  async generateReply(_context: BrainContext): Promise<BrainReply> {
    throw new Error(
      "GPT4oBrain is not wired up yet. Implement the OpenAI Realtime/Chat call here.",
    );
  }
}
