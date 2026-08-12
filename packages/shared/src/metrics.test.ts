import assert from "node:assert/strict";
import { test } from "node:test";
import type { Call, Patient } from "./call.js";
import { computeMetrics } from "./metrics.js";

const patient = (id: string, consent: Patient["consent"]): Patient => ({
  id,
  name: id,
  condition: "varicose-veins",
  consent,
  offeredAt: "2026-08-10T00:00:00Z",
});

const call = (
  id: string,
  outcome: Call["outcome"],
  openFlag = false,
): Call => ({
  id,
  patientId: id,
  brain: "claude",
  voice: "vapi",
  startedAt: "2026-08-10T00:00:00Z",
  outcome,
  transcript: [],
  flags: openFlag ? [{ type: "overstated_outcome", note: "x", open: true }] : [],
});

test("computes conversion rate as booked / accepted", () => {
  const patients = [
    patient("a", "accepted"),
    patient("b", "accepted"),
    patient("c", "accepted"),
    patient("d", "accepted"),
    patient("e", "declined"),
  ];
  const calls = [
    call("a", "booked"),
    call("b", "booked"),
    call("c", "follow_up"),
    call("d", "escalated", true),
  ];
  const m = computeMetrics(patients, calls);
  assert.equal(m.offered, 5);
  assert.equal(m.accepted, 4);
  assert.equal(m.declined, 1);
  assert.equal(m.booked, 2);
  assert.equal(m.followUp, 1);
  assert.equal(m.escalated, 1);
  assert.equal(m.conversionRate, 0.5);
  assert.equal(m.flaggedCalls, 1);
});

test("conversion rate is 0 with no accepted patients (no divide by zero)", () => {
  const m = computeMetrics([patient("a", "declined")], []);
  assert.equal(m.conversionRate, 0);
});
