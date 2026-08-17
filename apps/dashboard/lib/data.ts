import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Call, Patient } from "@leah/shared";
import { CALLS as MOCK_CALLS, PATIENTS as MOCK_PATIENTS } from "./mock-data";

/**
 * Dashboard data source. Reads real calls/patients from the runtime's JSON
 * store when the files exist; otherwise falls back to the bundled sample data
 * so the app always renders. Point it at your store with `LEAH_DATA_DIR`.
 *
 * The store shape matches `@leah/voice`'s JsonFileCallStore: a JSON object
 * keyed by id (an array is also accepted). No dependency on the voice package —
 * the dashboard reads the file directly and shares only the `@leah/shared` types.
 * TODO(dashboard): swap the JSON files for the production datastore.
 */
const DATA_DIR = process.env.LEAH_DATA_DIR ?? resolve(process.cwd(), "../../data");
const CALLS_FILE = resolve(DATA_DIR, "calls.json");
const PATIENTS_FILE = resolve(DATA_DIR, "patients.json");

function readRecords<T>(file: string): T[] | null {
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (Array.isArray(parsed)) return parsed as T[];
    if (parsed && typeof parsed === "object") return Object.values(parsed) as T[];
    return null;
  } catch {
    return null;
  }
}

export type DataSource = "live" | "sample";

export function getCalls(): Call[] {
  return readRecords<Call>(CALLS_FILE) ?? MOCK_CALLS;
}

export function getPatients(): Patient[] {
  return readRecords<Patient>(PATIENTS_FILE) ?? MOCK_PATIENTS;
}

export function getCall(id: string): Call | undefined {
  return getCalls().find((c) => c.id === id);
}

export function getPatient(id: string): Patient | undefined {
  return getPatients().find((p) => p.id === id);
}

/** "live" when reading real call data, "sample" when on the bundled mock set. */
export function dataSource(): DataSource {
  return readRecords<Call>(CALLS_FILE) ? "live" : "sample";
}
