import type { BrainAdapter, BrainContext, BrainReply } from "@leah/shared";

export interface NovaSonicBrainConfig {
  region: string;
  /** Bedrock model id for Nova Sonic. */
  modelId?: string;
}

/**
 * Amazon Nova 2 Sonic as the "brain" — a unified speech-to-speech model, so
 * brain and mouth are one system. HIPAA-eligible via Bedrock, strong
 * instruction-following and tool-calling, and materially cheaper per minute than
 * GPT-4o Realtime in early comparisons. The compliance + cost angle makes it a
 * serious side-by-side candidate.
 *
 * TODO(voice): wire to Amazon Bedrock (Nova Sonic). Because it is
 * speech-to-speech, there is no separate VoiceAdapter — Nova Sonic is both. The
 * engine's assembled system prompt + retrieved set A/B context become the
 * session instructions; tool-calling can drive booking. For text-only offline
 * evaluation against Claude/GPT-4o, use its text interface here.
 */
export class NovaSonicBrain implements BrainAdapter {
  readonly id = "nova-sonic" as const;
  private readonly config: NovaSonicBrainConfig;

  constructor(config: NovaSonicBrainConfig) {
    this.config = config;
  }

  async generateReply(_context: BrainContext): Promise<BrainReply> {
    throw new Error(
      "NovaSonicBrain is not wired up yet. Implement the Bedrock Nova Sonic call here.",
    );
  }
}
