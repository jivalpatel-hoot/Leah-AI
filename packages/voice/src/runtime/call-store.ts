import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { Call } from "@leah/shared";

/**
 * Where finished calls are persisted. The dashboard reads from a store like this
 * instead of mock data once calls are real. Kept behind an interface so the
 * pilot can start in-memory / on-disk and swap to a database without touching
 * the runtime or the dashboard.
 */
export interface CallStore {
  save(call: Call): Promise<void>;
  get(id: string): Promise<Call | undefined>;
  list(): Promise<Call[]>;
}

/** Simplest store — fine for tests and a single-process pilot. */
export class InMemoryCallStore implements CallStore {
  private readonly calls = new Map<string, Call>();

  async save(call: Call): Promise<void> {
    this.calls.set(call.id, call);
  }
  async get(id: string): Promise<Call | undefined> {
    return this.calls.get(id);
  }
  async list(): Promise<Call[]> {
    return [...this.calls.values()];
  }
}

/**
 * JSON-file store. NOTE: real transcripts are PHI — the default `data/` path is
 * gitignored. Use only for local pilots; move to an encrypted datastore for
 * anything beyond that.
 */
export class JsonFileCallStore implements CallStore {
  constructor(private readonly path: string) {}

  private read(): Record<string, Call> {
    if (!existsSync(this.path)) return {};
    return JSON.parse(readFileSync(this.path, "utf8")) as Record<string, Call>;
  }
  private write(data: Record<string, Call>): void {
    mkdirSync(dirname(this.path), { recursive: true });
    writeFileSync(this.path, JSON.stringify(data, null, 2));
  }

  async save(call: Call): Promise<void> {
    const data = this.read();
    data[call.id] = call;
    this.write(data);
  }
  async get(id: string): Promise<Call | undefined> {
    return this.read()[id];
  }
  async list(): Promise<Call[]> {
    return Object.values(this.read());
  }
}
