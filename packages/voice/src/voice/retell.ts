import type { VoiceAdapter, VoiceCallHandlers, StartCallOptions } from "./adapter.js";

export interface RetellConfig {
  apiKey: string;
  agentId: string;
}

/**
 * Retell AI as the voice platform ("mouth"). Pairs with a text brain.
 *
 * TODO(voice): implement against the Retell API/SDK. Bridge Retell's realtime
 * transcript events to `handlers.onPatientUtterance` and stream replies back.
 */
export class RetellAdapter implements VoiceAdapter {
  readonly platform = "retell" as const;
  private readonly config: RetellConfig;

  constructor(config: RetellConfig) {
    this.config = config;
  }

  async startCall(_options: StartCallOptions, _handlers: VoiceCallHandlers): Promise<string> {
    throw new Error("RetellAdapter is not wired up yet. Implement the Retell call flow here.");
  }

  async endCall(_callId: string): Promise<void> {
    throw new Error("RetellAdapter.endCall is not wired up yet.");
  }
}
