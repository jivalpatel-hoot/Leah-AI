import type { KnowledgeSet } from "./knowledge.js";

/** Which reasoning engine ("brain") produced the conversation. */
export type BrainId = "claude" | "gpt-4o-realtime" | "nova-sonic";

/** Which voice platform ("mouth") delivered it. Nova Sonic bundles its own. */
export type VoicePlatform = "vapi" | "retell" | "bland" | "nova-sonic-builtin";

/** Whether the patient was offered — and accepted — the AI voice agent. */
export type ConsentStatus = "offered" | "accepted" | "declined";

/** The single most important field per call for the dashboard. */
export type CallOutcome =
  | "booked" // appointment booked — the conversion
  | "follow_up" // needs a follow-up call
  | "escalated" // handed off to a human
  | "no_answer"
  | "declined"; // patient declined to continue

/** A minimal patient/lead record. Real PHI lives in the practice's system. */
export interface Patient {
  id: string;
  name: string;
  /** The condition this outreach is about — scopes the knowledge base. */
  condition: string;
  consent: ConsentStatus;
  offeredAt: string; // ISO datetime
}

/**
 * A reason a call was flagged for human review. The whole point of the pilot is
 * that 100% of transcripts are reviewed; flags surface the ones that matter.
 */
export type FlagType =
  | "off_knowledge_base" // Leah asserted something not traceable to set A
  | "human_handoff" // Leah redirected to a human
  | "manufactured_urgency" // possible urgency-tactic violation (set B rule)
  | "overstated_outcome" // possible overstated clinical outcome
  | "low_confidence_retrieval"; // nothing relevant retrieved for a factual claim

export interface CallFlag {
  type: FlagType;
  /** The transcript turn this flag attaches to, if any. */
  turnId?: string;
  note: string;
  /** True until a human reviewer clears it. */
  open: boolean;
}

/** One conversational turn. */
export interface TranscriptTurn {
  id: string;
  role: "leah" | "patient" | "system";
  text: string;
  at: string; // ISO datetime
  /** Docs this turn drew from — makes each assertion auditable. */
  citations?: Array<{ docId: string; set: KnowledgeSet; version: number }>;
}

/** A concrete next step Leah proposed or booked. Never leave calls open-ended. */
export interface AppointmentProposal {
  proposedTimes: string[]; // ISO datetimes offered to the patient
  bookedTime?: string; // ISO datetime, set when the patient accepts one
}

export interface Call {
  id: string;
  patientId: string;
  brain: BrainId;
  voice: VoicePlatform;
  startedAt: string;
  endedAt?: string;
  durationSec?: number;
  outcome: CallOutcome;
  transcript: TranscriptTurn[];
  flags: CallFlag[];
  appointment?: AppointmentProposal;
  /** Set once a human has reviewed the transcript. */
  reviewedAt?: string;
  reviewedBy?: string;
}
