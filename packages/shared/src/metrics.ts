import type { Call, Patient } from "./call.js";

/** Aggregate numbers the dashboard shows. */
export interface PilotMetrics {
  offered: number;
  accepted: number;
  declined: number;
  booked: number;
  followUp: number;
  escalated: number;
  /** booked / accepted — the headline conversion rate. */
  conversionRate: number;
  /** Calls with at least one open flag. */
  flaggedCalls: number;
  totalCalls: number;
}

/**
 * Compute the pilot metrics from raw records. Pure function — the dashboard and
 * any reporting job can both call it and agree on the numbers.
 */
export function computeMetrics(patients: Patient[], calls: Call[]): PilotMetrics {
  const offered = patients.length;
  const accepted = patients.filter((p) => p.consent === "accepted").length;
  const declined = patients.filter((p) => p.consent === "declined").length;

  const booked = calls.filter((c) => c.outcome === "booked").length;
  const followUp = calls.filter((c) => c.outcome === "follow_up").length;
  const escalated = calls.filter((c) => c.outcome === "escalated").length;
  const flaggedCalls = calls.filter((c) =>
    c.flags.some((f) => f.open),
  ).length;

  return {
    offered,
    accepted,
    declined,
    booked,
    followUp,
    escalated,
    conversionRate: accepted === 0 ? 0 : booked / accepted,
    flaggedCalls,
    totalCalls: calls.length,
  };
}
