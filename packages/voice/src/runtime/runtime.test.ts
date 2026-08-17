import assert from "node:assert/strict";
import { test } from "node:test";
import type { Patient } from "@leah/shared";
import { createKnowledgeBase } from "@leah/knowledge-base";
import { LeahEngine } from "../engine.js";
import { MockBrain } from "../brains/mock.js";
import { LeahConversation } from "./conversation.js";
import { InMemoryCallStore } from "./call-store.js";

const PATIENT: Patient = {
  id: "p-test",
  name: "Test Patient",
  condition: "varicose-veins",
  consent: "accepted",
  offeredAt: "2026-08-01T00:00:00Z",
};

function makeConversation() {
  const { retriever } = createKnowledgeBase();
  const engine = new LeahEngine({ retriever, brain: new MockBrain() });
  // Deterministic clock: one tick per call, so durations are stable.
  let t = 0;
  const clock = () => new Date(Date.UTC(2026, 7, 1, 0, 0, t++)).toISOString();
  return new LeahConversation({
    callId: "call-1",
    patient: PATIENT,
    engine,
    brain: "claude",
    voice: "vapi",
    clock,
  });
}

test("drives a call, builds a transcript, and derives an outcome", async () => {
  const convo = makeConversation();
  const r1 = await convo.handleUtterance("Hi, who is this?");
  const r2 = await convo.handleUtterance("My legs ache. What can you do about it?");
  assert.ok(r1.length > 0);
  assert.ok(r2.length > 0);

  const call = convo.end();
  // patient + leah per utterance = 4 turns.
  assert.equal(call.transcript.length, 4);
  assert.equal(call.transcript[0]!.role, "patient");
  assert.equal(call.transcript[1]!.role, "leah");
  assert.equal(call.patientId, "p-test");
  assert.ok(["booked", "follow_up", "escalated", "no_answer", "declined"].includes(call.outcome));
});

test("a booked appointment yields a 'booked' outcome", async () => {
  const convo = makeConversation();
  await convo.handleUtterance("Hi.");
  await convo.handleUtterance("Okay, let's book.");
  convo.setAppointment({
    proposedTimes: ["2026-08-14T18:15:00Z"],
    bookedTime: "2026-08-14T18:15:00Z",
  });
  const call = convo.end();
  assert.equal(call.outcome, "booked");
});

test("persists the finished call to a store the dashboard can read", async () => {
  const store = new InMemoryCallStore();
  const convo = makeConversation();
  await convo.handleUtterance("Hi there.");
  const call = convo.end();
  await store.save(call);

  const loaded = await store.get("call-1");
  assert.ok(loaded);
  assert.equal(loaded!.id, "call-1");
  assert.deepEqual((await store.list()).map((c) => c.id), ["call-1"]);
});

test("refuses to accept more utterances after the call ends", async () => {
  const convo = makeConversation();
  await convo.handleUtterance("Hi.");
  convo.end();
  await assert.rejects(() => convo.handleUtterance("still there?"), /already ended/);
});
