import type { CallOutcome, ConsentStatus, FlagType } from "@leah/shared";
import type { ReactNode } from "react";

export function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtDuration(sec?: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

const OUTCOME_LABELS: Record<CallOutcome, { label: string; cls: string }> = {
  booked: { label: "Booked", cls: "badge-green" },
  follow_up: { label: "Follow-up", cls: "badge-amber" },
  escalated: { label: "Escalated", cls: "badge-blue" },
  no_answer: { label: "No answer", cls: "badge-gray" },
  declined: { label: "Declined", cls: "badge-gray" },
};

export function OutcomeBadge({ outcome }: { outcome: CallOutcome }): ReactNode {
  const o = OUTCOME_LABELS[outcome];
  return <span className={`badge ${o.cls}`}>{o.label}</span>;
}

const CONSENT_LABELS: Record<ConsentStatus, { label: string; cls: string }> = {
  accepted: { label: "Yes", cls: "badge-green" },
  declined: { label: "No", cls: "badge-red" },
  offered: { label: "Pending", cls: "badge-gray" },
};

export function ConsentBadge({ consent }: { consent: ConsentStatus }): ReactNode {
  const c = CONSENT_LABELS[consent];
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

const FLAG_LABELS: Record<FlagType, string> = {
  off_knowledge_base: "Off knowledge base",
  human_handoff: "Human handoff",
  manufactured_urgency: "Manufactured urgency",
  overstated_outcome: "Overstated outcome",
  low_confidence_retrieval: "Low-confidence retrieval",
};

export function FlagBadge({ type, open }: { type: FlagType; open: boolean }): ReactNode {
  return (
    <span className={`badge ${open ? "badge-red" : "badge-gray"}`}>
      {FLAG_LABELS[type]}
      {open ? "" : " · cleared"}
    </span>
  );
}

const BRAIN_LABELS: Record<string, string> = {
  claude: "Claude",
  "gpt-4o-realtime": "GPT-4o",
  "nova-sonic": "Nova Sonic",
};

export function brainLabel(id: string): string {
  return BRAIN_LABELS[id] ?? id;
}
