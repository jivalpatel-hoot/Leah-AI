import type { Call, Patient } from "@leah/shared";

/**
 * Mock pilot data so the dashboard runs end-to-end today. Replace `getPatients`
 * / `getCalls` with reads from the real data store as calls come in — the rest
 * of the dashboard depends only on the @leah/shared types, not on this file.
 * TODO(dashboard): back these with the real call/outcome store.
 */

export const PATIENTS: Patient[] = [
  { id: "p1", name: "Maria Alvarez", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-10T14:02:00Z" },
  { id: "p2", name: "James Chen", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-10T15:20:00Z" },
  { id: "p3", name: "Priya Nair", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-11T09:15:00Z" },
  { id: "p4", name: "Robert Okafor", condition: "varicose-veins", consent: "declined", offeredAt: "2026-08-11T10:05:00Z" },
  { id: "p5", name: "Susan Delgado", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-11T11:40:00Z" },
  { id: "p6", name: "Tom Whitfield", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-11T13:12:00Z" },
  { id: "p7", name: "Aisha Rahman", condition: "varicose-veins", consent: "offered", offeredAt: "2026-08-12T08:50:00Z" },
  { id: "p8", name: "Daniel Park", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-12T09:30:00Z" },
];

export const CALLS: Call[] = [
  {
    id: "c1",
    patientId: "p1",
    brain: "claude",
    voice: "vapi",
    startedAt: "2026-08-10T16:00:00Z",
    endedAt: "2026-08-10T16:06:30Z",
    durationSec: 390,
    outcome: "booked",
    reviewedAt: "2026-08-10T18:00:00Z",
    reviewedBy: "Riya",
    appointment: {
      proposedTimes: ["2026-08-14T18:15:00Z", "2026-08-16T13:30:00Z"],
      bookedTime: "2026-08-14T18:15:00Z",
    },
    flags: [],
    transcript: [
      { id: "t1", role: "leah", text: "Hi, this is Leah, an AI assistant with the practice — is now an okay time to talk for a couple of minutes about your visit?", at: "2026-08-10T16:00:05Z" },
      { id: "t2", role: "patient", text: "Sure, I have a few minutes.", at: "2026-08-10T16:00:20Z" },
      { id: "t3", role: "leah", text: "Great. You'd mentioned some aching and heaviness in your legs — modern vein treatment is typically done in the office and is minimally invasive, and the exact approach is decided by the physician at a consultation. Would it help to walk through what that visit looks like?", at: "2026-08-10T16:01:10Z", citations: [{ docId: "specialty/varicose-veins/procedure-overview", set: "specialty", version: 1 }] },
      { id: "t4", role: "patient", text: "Yeah. Honestly my main worry is what it costs.", at: "2026-08-10T16:02:00Z" },
      { id: "t5", role: "leah", text: "That's a really common and fair question. Many medically necessary vein procedures are covered at least in part — it depends on your plan — and the team verifies your benefits and reviews all costs with you up front, so there's no surprise billing. The consultation is a no-obligation way to get a clear, personalized picture.", at: "2026-08-10T16:03:15Z", citations: [{ docId: "specialty/varicose-veins/cost-and-insurance", set: "specialty", version: 1 }] },
      { id: "t6", role: "patient", text: "Okay, that makes sense. Let's do the consultation.", at: "2026-08-10T16:04:30Z" },
      { id: "t7", role: "leah", text: "Wonderful. I have Thursday at 2:15 or Saturday morning at 9:30 — would either of those work?", at: "2026-08-10T16:05:00Z" },
      { id: "t8", role: "patient", text: "Thursday works.", at: "2026-08-10T16:05:40Z" },
      { id: "t9", role: "leah", text: "You're booked for Thursday at 2:15. You'll get a confirmation by text. Thanks, Maria!", at: "2026-08-10T16:06:10Z" },
    ],
  },
  {
    id: "c2",
    patientId: "p2",
    brain: "nova-sonic",
    voice: "nova-sonic-builtin",
    startedAt: "2026-08-10T17:00:00Z",
    endedAt: "2026-08-10T17:05:10Z",
    durationSec: 310,
    outcome: "follow_up",
    reviewedAt: "2026-08-10T19:00:00Z",
    reviewedBy: "Riya",
    appointment: { proposedTimes: ["2026-08-15T16:00:00Z"] },
    flags: [],
    transcript: [
      { id: "t1", role: "leah", text: "Hi James, this is Leah, an AI assistant with the practice. Is now a good time?", at: "2026-08-10T17:00:05Z" },
      { id: "t2", role: "patient", text: "A little busy, but go ahead.", at: "2026-08-10T17:00:20Z" },
      { id: "t3", role: "leah", text: "I'll be quick. Would it be helpful to set up a no-obligation consultation to get your questions answered by the physician?", at: "2026-08-10T17:01:00Z" },
      { id: "t4", role: "patient", text: "Let me think about it and check my schedule.", at: "2026-08-10T17:02:00Z" },
      { id: "t5", role: "leah", text: "Of course — no pressure at all. Could I give you a quick call back Friday afternoon to find a time that works?", at: "2026-08-10T17:03:00Z", citations: [] },
      { id: "t6", role: "patient", text: "Friday's fine.", at: "2026-08-10T17:04:20Z" },
    ],
  },
  {
    id: "c3",
    patientId: "p3",
    brain: "claude",
    voice: "retell",
    startedAt: "2026-08-11T10:00:00Z",
    endedAt: "2026-08-11T10:04:00Z",
    durationSec: 240,
    outcome: "escalated",
    reviewedAt: "2026-08-11T12:00:00Z",
    reviewedBy: "Riya",
    flags: [
      { type: "human_handoff", turnId: "t4", note: "Patient asked a detailed medical-risk question; Leah correctly handed off.", open: false },
    ],
    transcript: [
      { id: "t1", role: "leah", text: "Hi Priya, this is Leah, an AI assistant with the practice. Is now an okay time?", at: "2026-08-11T10:00:05Z" },
      { id: "t2", role: "patient", text: "Yes. I had a blood clot a few years ago — is this procedure safe for me specifically?", at: "2026-08-11T10:01:00Z" },
      { id: "t3", role: "leah", text: "That's an important question, and it's exactly the kind of thing our physician should answer for your specific situation rather than me. Let me connect you with our clinical team.", at: "2026-08-11T10:02:00Z" },
      { id: "t4", role: "system", text: "Call escalated to clinical staff (Nurse Angela).", at: "2026-08-11T10:03:00Z" },
    ],
  },
  {
    id: "c4",
    patientId: "p5",
    brain: "gpt-4o-realtime",
    voice: "vapi",
    startedAt: "2026-08-11T12:30:00Z",
    endedAt: "2026-08-11T12:36:00Z",
    durationSec: 360,
    outcome: "booked",
    reviewedAt: undefined,
    flags: [
      { type: "overstated_outcome", turnId: "t5", note: "Reply used the word 'painless' — possible overstated-outcome violation. Needs review.", open: true },
    ],
    appointment: {
      proposedTimes: ["2026-08-18T15:00:00Z", "2026-08-19T14:00:00Z"],
      bookedTime: "2026-08-18T15:00:00Z",
    },
    transcript: [
      { id: "t1", role: "leah", text: "Hi Susan, this is Leah, an AI assistant with the practice. Do you have a couple of minutes?", at: "2026-08-11T12:30:05Z" },
      { id: "t2", role: "patient", text: "Sure.", at: "2026-08-11T12:30:20Z" },
      { id: "t3", role: "leah", text: "You'd mentioned some visible veins and aching. Treatment is usually in-office and minimally invasive, with most patients back to normal activity quickly.", at: "2026-08-11T12:31:30Z", citations: [{ docId: "specialty/varicose-veins/procedure-overview", set: "specialty", version: 1 }] },
      { id: "t4", role: "patient", text: "Does it hurt?", at: "2026-08-11T12:32:30Z" },
      { id: "t5", role: "leah", text: "It's a painless procedure and you'll be totally fine — most people feel nothing at all.", at: "2026-08-11T12:33:10Z" },
      { id: "t6", role: "patient", text: "Okay, let's book it.", at: "2026-08-11T12:34:30Z" },
      { id: "t7", role: "leah", text: "Great — I have Tuesday at 3:00 or Wednesday at 2:00. Which works?", at: "2026-08-11T12:35:00Z" },
      { id: "t8", role: "patient", text: "Tuesday.", at: "2026-08-11T12:35:40Z" },
    ],
  },
  {
    id: "c5",
    patientId: "p6",
    brain: "nova-sonic",
    voice: "nova-sonic-builtin",
    startedAt: "2026-08-11T14:00:00Z",
    endedAt: "2026-08-11T14:03:20Z",
    durationSec: 200,
    outcome: "declined",
    reviewedAt: "2026-08-11T16:00:00Z",
    reviewedBy: "Riya",
    flags: [],
    transcript: [
      { id: "t1", role: "leah", text: "Hi Tom, this is Leah, an AI assistant with the practice. Is now a good time?", at: "2026-08-11T14:00:05Z" },
      { id: "t2", role: "patient", text: "Not interested, thanks.", at: "2026-08-11T14:00:30Z" },
      { id: "t3", role: "leah", text: "No problem at all — I appreciate you letting me know. If you change your mind, the practice is always here. Take care!", at: "2026-08-11T14:01:00Z" },
    ],
  },
  {
    id: "c6",
    patientId: "p8",
    brain: "claude",
    voice: "retell",
    startedAt: "2026-08-12T10:00:00Z",
    endedAt: "2026-08-12T10:05:30Z",
    durationSec: 330,
    outcome: "booked",
    reviewedAt: undefined,
    flags: [
      { type: "low_confidence_retrieval", turnId: "t4", note: "Patient asked about recovery time; little set A content retrieved. Verify the claim is grounded.", open: true },
    ],
    appointment: {
      proposedTimes: ["2026-08-20T17:00:00Z", "2026-08-21T16:30:00Z"],
      bookedTime: "2026-08-21T16:30:00Z",
    },
    transcript: [
      { id: "t1", role: "leah", text: "Hi Daniel, this is Leah, an AI assistant with the practice. Got a couple of minutes?", at: "2026-08-12T10:00:05Z" },
      { id: "t2", role: "patient", text: "Yep.", at: "2026-08-12T10:00:20Z" },
      { id: "t3", role: "patient", text: "How long is recovery? I can't take much time off work.", at: "2026-08-12T10:01:30Z" },
      { id: "t4", role: "leah", text: "Most patients return to normal activity quickly and the procedure is done in the office, but the physician will give you specific aftercare guidance for your situation at the consultation.", at: "2026-08-12T10:02:30Z", citations: [{ docId: "specialty/varicose-veins/procedure-overview", set: "specialty", version: 1 }] },
      { id: "t5", role: "patient", text: "Okay, that works. Let's schedule.", at: "2026-08-12T10:03:40Z" },
      { id: "t6", role: "leah", text: "I have Thursday at 5:00 or Friday at 4:30 — which is better?", at: "2026-08-12T10:04:30Z" },
      { id: "t7", role: "patient", text: "Friday.", at: "2026-08-12T10:05:00Z" },
    ],
  },
];

export function getPatients(): Patient[] {
  return PATIENTS;
}

export function getCalls(): Call[] {
  return CALLS;
}

export function getCall(id: string): Call | undefined {
  return CALLS.find((c) => c.id === id);
}

export function getPatient(id: string): Patient | undefined {
  return PATIENTS.find((p) => p.id === id);
}
