import type { VoicePlatform } from "@leah/shared";

/** A single speech event coming from the caller side. */
export interface InboundSpeechEvent {
  transcript: string;
  isFinal: boolean;
}

export interface VoiceCallHandlers {
  /** Called with each (final) patient utterance; return what Leah should say. */
  onPatientUtterance(transcript: string): Promise<string>;
  onCallEnded?(reason: string): void | Promise<void>;
}

export interface StartCallOptions {
  toPhoneNumber: string;
  patientId: string;
  condition: string;
}

/**
 * The "mouth" — text-to-speech, speech-to-text, and turn-taking. Used only when
 * the brain and mouth are NOT bundled (e.g. Claude or GPT-4o text mode as the
 * brain). With Nova Sonic (speech-to-speech) there is no separate VoiceAdapter;
 * the brain is the mouth.
 *
 * Implementations: Vapi, Retell AI, Bland AI. All expose roughly the same shape —
 * place/receive a call, stream STT in, stream TTS out, manage barge-in — so the
 * rest of the system depends only on this interface.
 */
export interface VoiceAdapter {
  readonly platform: VoicePlatform;
  /** Place an outbound call and drive the loop via handlers. Returns a call id. */
  startCall(options: StartCallOptions, handlers: VoiceCallHandlers): Promise<string>;
  endCall(callId: string): Promise<void>;
}
