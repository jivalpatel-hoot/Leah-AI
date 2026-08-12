import type { VoiceAdapter, VoiceCallHandlers, StartCallOptions } from "./adapter.js";

export interface BlandConfig {
  apiKey: string;
}

/**
 * Bland AI as the voice platform ("mouth"). Pairs with a text brain.
 *
 * TODO(voice): implement against the Bland API. Bridge Bland's transcript
 * callbacks to `handlers.onPatientUtterance` and speak the returned text.
 */
export class BlandAdapter implements VoiceAdapter {
  readonly platform = "bland" as const;
  private readonly config: BlandConfig;

  constructor(config: BlandConfig) {
    this.config = config;
  }

  async startCall(_options: StartCallOptions, _handlers: VoiceCallHandlers): Promise<string> {
    throw new Error("BlandAdapter is not wired up yet. Implement the Bland call flow here.");
  }

  async endCall(_callId: string): Promise<void> {
    throw new Error("BlandAdapter.endCall is not wired up yet.");
  }
}
