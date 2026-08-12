import type { BrainAdapter, BrainContext, BrainReply } from "@leah/shared";

export interface ClaudeBrainConfig {
  apiKey: string;
  /** Defaults to a current Claude model. */
  model?: string;
}

/**
 * Claude as the "brain". The brief's first choice for testing conversation
 * quality and safety — strong at staying inside guardrails.
 *
 * TODO(voice): wire to the Anthropic Messages API. The system prompt is already
 * assembled by the engine (context.systemPrompt); send it as `system` and pass
 * context.history as the message list. Ask the model to return the reply text
 * plus which set-A doc ids it used (a small tool / JSON schema) so citations and
 * guardrails work. If pairing with a separate voice platform (Vapi/Retell/Bland),
 * this brain produces text and the VoiceAdapter speaks it.
 */
export class ClaudeBrain implements BrainAdapter {
  readonly id = "claude" as const;
  private readonly config: ClaudeBrainConfig;

  constructor(config: ClaudeBrainConfig) {
    this.config = config;
  }

  async generateReply(_context: BrainContext): Promise<BrainReply> {
    throw new Error(
      "ClaudeBrain is not wired up yet. Implement the Anthropic Messages API call here. " +
        "See MockBrain for the shape of a working BrainAdapter.",
    );
  }
}
