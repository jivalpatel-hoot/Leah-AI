import type {
  BrainId,
  Call,
  CallFlag,
  CallOutcome,
  ConversationStage,
  ConversationMessage,
  Patient,
  TranscriptTurn,
  VoicePlatform,
} from "@leah/shared";
import { LeahEngine } from "../engine.js";

export interface LeahConversationOptions {
  callId: string;
  patient: Patient;
  engine: LeahEngine;
  brain: BrainId;
  voice: VoicePlatform;
  /** Timestamp source, injectable for deterministic tests. */
  clock?: () => string;
  startedAt?: string;
}

/**
 * Drives a single live call. A voice adapter (or a test) feeds it each patient
 * utterance; it runs the RAG turn through the engine, appends both sides to the
 * transcript with citations, accumulates guardrail flags, tracks the stage, and
 * on `end()` produces a finished `Call` — the exact record the dashboard renders
 * and the pilot reviews.
 *
 * Wiring to a real `VoiceAdapter`: pass `conversation.handleUtterance` as the
 * adapter's `onPatientUtterance` handler, and call `end()` from `onCallEnded`.
 */
export class LeahConversation {
  private readonly opts: LeahConversationOptions;
  private readonly clock: () => string;
  private readonly transcript: TranscriptTurn[] = [];
  private readonly flags: CallFlag[] = [];
  private readonly history: ConversationMessage[] = [];
  private stage: ConversationStage = "rapport";
  private turnCount = 0;
  private appointment: Call["appointment"];
  private ended = false;
  private readonly startedAt: string;

  constructor(options: LeahConversationOptions) {
    this.opts = options;
    this.clock = options.clock ?? (() => new Date().toISOString());
    this.startedAt = options.startedAt ?? this.clock();
  }

  /** Process one patient utterance and return what Leah says back. */
  async handleUtterance(text: string): Promise<string> {
    if (this.ended) throw new Error("Call has already ended.");

    const at = this.clock();
    this.transcript.push({ id: this.nextTurnId(), role: "patient", text, at });
    this.history.push({ role: "patient", text });

    const result = await this.opts.engine.runTurn({
      condition: this.opts.patient.condition,
      stage: this.stage,
      history: this.history,
      patientMessage: text,
      factualQuestion: looksFactual(text),
    });

    const reply = result.reply.text;
    this.transcript.push({
      id: this.nextTurnId(),
      role: "leah",
      text: reply,
      at: this.clock(),
      citations: result.turn.citations,
    });
    this.history.push({ role: "leah", text: reply });
    this.flags.push(...result.flags);
    this.stage = result.nextStage;
    return reply;
  }

  /** Record a booked appointment (called by the booking tool when one lands). */
  setAppointment(appointment: NonNullable<Call["appointment"]>): void {
    this.appointment = appointment;
  }

  /** Force the outcome (e.g. the patient explicitly declined). Optional —
   *  `end()` derives a sensible outcome if you don't. */
  private forcedOutcome?: CallOutcome;
  setOutcome(outcome: CallOutcome): void {
    this.forcedOutcome = outcome;
  }

  /** Finalize the call and return the persisted-shape record. */
  end(endedAt?: string): Call {
    this.ended = true;
    const finishedAt = endedAt ?? this.clock();
    return {
      id: this.opts.callId,
      patientId: this.opts.patient.id,
      brain: this.opts.brain,
      voice: this.opts.voice,
      startedAt: this.startedAt,
      endedAt: finishedAt,
      durationSec: durationSec(this.startedAt, finishedAt),
      outcome: this.forcedOutcome ?? this.deriveOutcome(),
      transcript: this.transcript,
      flags: this.flags,
      appointment: this.appointment,
    };
  }

  /** Best-effort outcome from the call's own signals. Booking + declines are set
   *  explicitly by the caller; everything else falls back conservatively. */
  private deriveOutcome(): CallOutcome {
    if (this.appointment?.bookedTime) return "booked";
    if (this.flags.some((f) => f.type === "human_handoff")) return "escalated";
    if (this.transcript.length <= 2) return "no_answer";
    return "follow_up";
  }

  private nextTurnId(): string {
    return `${this.opts.callId}-t${++this.turnCount}`;
  }
}

/** Heuristic: did the patient ask a clinical/factual question this turn? */
function looksFactual(text: string): boolean {
  return /\?/.test(text) || /\b(cost|insurance|safe|risk|pain|hurt|recover|side effect|procedure|how|what|does)\b/i.test(text);
}

function durationSec(startISO: string, endISO: string): number {
  const start = Date.parse(startISO);
  const end = Date.parse(endISO);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.round((end - start) / 1000));
}
