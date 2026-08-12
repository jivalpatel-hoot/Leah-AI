import type {
  BrainReply,
  CallFlag,
  RetrievedChunk,
} from "@leah/shared";

/**
 * Phrases that suggest an overstated clinical outcome. Deliberately broad — a
 * false positive just sends a turn to human review, which is cheap; a false
 * negative lets an over-promise reach a patient, which is not.
 */
const OVERSTATED_OUTCOME_PATTERNS: RegExp[] = [
  /\bpainless\b/i,
  /\brisk[-\s]?free\b/i,
  /\b100\s?%\b/i,
  /\bguarantee(d|s)?\b/i,
  /\bcompletely safe\b/i,
  /\bno risk(s)?\b/i,
  /\bwill (definitely |certainly )?(cure|fix|heal)\b/i,
  /\bcure(s|d)?\b/i,
];

/** Phrases that suggest manufactured urgency / scarcity. */
const MANUFACTURED_URGENCY_PATTERNS: RegExp[] = [
  /\bonly a few (spots|slots|appointments)\b/i,
  /\bspots? (are )?filling up\b/i,
  /\bthis offer\b/i,
  /\bexpires?\b/i,
  /\blimited time\b/i,
  /\bact (now|fast|today)\b/i,
  /\blast chance\b/i,
  /\bwon'?t last\b/i,
];

export interface GuardrailInput {
  reply: BrainReply;
  specialtyContext: RetrievedChunk[];
  /** True if this turn is one where the patient asked a clinical/factual question. */
  factualQuestion?: boolean;
}

/**
 * Inspect a brain reply for guardrail violations and return the flags it should
 * carry. Returning flags rather than throwing keeps the call flowing — the whole
 * pilot model is "let it through, but flag it for the 100% human review."
 */
export function checkReply(input: GuardrailInput): CallFlag[] {
  const flags: CallFlag[] = [];
  const text = input.reply.text;

  for (const re of OVERSTATED_OUTCOME_PATTERNS) {
    if (re.test(text)) {
      flags.push({
        type: "overstated_outcome",
        note: `Reply matched an overstated-outcome pattern (${re}). Review against set A.`,
        open: true,
      });
      break;
    }
  }

  for (const re of MANUFACTURED_URGENCY_PATTERNS) {
    if (re.test(text)) {
      flags.push({
        type: "manufactured_urgency",
        note: `Reply matched a manufactured-urgency pattern (${re}). Confirm it reflects a real scheduling fact.`,
        open: true,
      });
      break;
    }
  }

  // The brain says it needs a human — record the handoff for review.
  if (input.reply.wantsHumanHandoff) {
    flags.push({
      type: "human_handoff",
      note: "Brain requested a human handoff (need outside approved material).",
      open: true,
    });
  }

  // A factual question with nothing retrieved from set A is a risk: the reply
  // may be answering from general training knowledge.
  if (input.factualQuestion && input.specialtyContext.length === 0) {
    flags.push({
      type: "low_confidence_retrieval",
      note: "Factual question but no set A content retrieved — reply may not be grounded.",
      open: true,
    });
  }

  // The brain claims to cite docs that weren't in the retrieved set A context.
  const retrievedIds = new Set(input.specialtyContext.map((c) => c.docId));
  const bogusCitations = input.reply.citedDocIds.filter(
    (id) => id.startsWith("specialty/") && !retrievedIds.has(id),
  );
  if (bogusCitations.length > 0) {
    flags.push({
      type: "off_knowledge_base",
      note: `Reply cited set A docs not retrieved this turn: ${bogusCitations.join(", ")}.`,
      open: true,
    });
  }

  return flags;
}
