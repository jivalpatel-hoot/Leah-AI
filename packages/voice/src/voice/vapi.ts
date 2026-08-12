import type { VoiceAdapter, VoiceCallHandlers, StartCallOptions } from "./adapter.js";

export interface VapiConfig {
  apiKey: string;
  /** The Vapi assistant/phone-number id to place calls from. */
  fromNumberId: string;
}

/**
 * Vapi as the voice platform ("mouth"). Handles TTS, STT, and turn-taking; pairs
 * with a text brain (Claude / GPT-4o text mode).
 *
 * TODO(voice): implement against the Vapi API/SDK. Wire Vapi's transcript
 * webhooks to `handlers.onPatientUtterance`, and speak the returned text back.
 */
export class VapiAdapter implements VoiceAdapter {
  readonly platform = "vapi" as const;
  private readonly config: VapiConfig;

  constructor(config: VapiConfig) {
    this.config = config;
  }

  async startCall(_options: StartCallOptions, _handlers: VoiceCallHandlers): Promise<string> {
    throw new Error("VapiAdapter is not wired up yet. Implement the Vapi call flow here.");
  }

  async endCall(_callId: string): Promise<void> {
    throw new Error("VapiAdapter.endCall is not wired up yet.");
  }
}
