/**
 * Seed the local call store with a few finished calls, so the dashboard's
 * "live data" path can be demonstrated end-to-end without any API keys or a
 * real phone call: runtime (LeahConversation) → JsonFileCallStore → dashboard.
 *
 *   npm run seed -w packages/voice
 *   npm run dev -w apps/dashboard   # now shows "live data"
 *
 * Writes <repo>/data/calls.json and data/patients.json (gitignored).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Patient } from "@leah/shared";
import { createKnowledgeBase } from "@leah/knowledge-base";
import { LeahEngine } from "../src/engine.js";
import { MockBrain } from "../src/brains/mock.js";
import { LeahConversation } from "../src/runtime/conversation.js";
import { JsonFileCallStore } from "../src/runtime/call-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "..", "data");

const PATIENTS: Patient[] = [
  { id: "p1", name: "Maria Alvarez", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-10T14:02:00Z" },
  { id: "p2", name: "James Chen", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-10T15:20:00Z" },
  { id: "p3", name: "Priya Nair", condition: "varicose-veins", consent: "accepted", offeredAt: "2026-08-11T09:15:00Z" },
  { id: "p4", name: "Robert Okafor", condition: "varicose-veins", consent: "declined", offeredAt: "2026-08-11T10:05:00Z" },
];

async function main() {
  const { retriever } = createKnowledgeBase();
  const engine = new LeahEngine({ retriever, brain: new MockBrain() });
  const store = new JsonFileCallStore(join(DATA_DIR, "calls.json"));

  // A deterministic clock so seeded timestamps/durations are stable.
  let tick = 0;
  const clock = () => new Date(Date.UTC(2026, 7, 12, 16, 0, tick++ * 15)).toISOString();

  // p1 — books.
  const c1 = new LeahConversation({ callId: "call-1", patient: PATIENTS[0]!, engine, brain: "claude", voice: "vapi", clock });
  await c1.handleUtterance("Hi, who is this?");
  await c1.handleUtterance("My legs ache. What can you do about it?");
  await c1.handleUtterance("What does it cost?");
  await c1.handleUtterance("Okay, let's book.");
  c1.setAppointment({ proposedTimes: ["2026-08-14T18:15:00Z"], bookedTime: "2026-08-14T18:15:00Z" });
  const call1 = c1.end();
  call1.reviewedAt = "2026-08-12T18:00:00Z";
  call1.reviewedBy = "Riya";

  // p2 — follow-up.
  const c2 = new LeahConversation({ callId: "call-2", patient: PATIENTS[1]!, engine, brain: "claude", voice: "vapi", clock });
  await c2.handleUtterance("A little busy, go ahead.");
  await c2.handleUtterance("Let me think about it.");
  const call2 = c2.end();

  // p3 — asks an out-of-scope question; mock brain hands off → escalated.
  const c3 = new LeahConversation({ callId: "call-3", patient: PATIENTS[2]!, engine, brain: "claude", voice: "retell", clock });
  await c3.handleUtterance("Hi.");
  await c3.handleUtterance("I had a blood clot before — is this safe for me specifically?");
  const call3 = c3.end();

  for (const c of [call1, call2, call3]) await store.save(c);

  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, "patients.json"), JSON.stringify(PATIENTS, null, 2));

  console.log(`Seeded ${(await store.list()).length} calls + ${PATIENTS.length} patients to ${DATA_DIR}`);
  console.log("Run the dashboard (npm run dev -w apps/dashboard) — it now shows 'live data'.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
