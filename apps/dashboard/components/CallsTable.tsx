"use client";

import { useMemo, useState } from "react";
import type { Call, CallOutcome } from "@leah/shared";
import {
  OutcomeBadge,
  brainLabel,
  fmtDateTime,
  fmtDuration,
} from "@/lib/format";

/** A row's worth of data, pre-flattened on the server (Calls are serializable). */
export interface CallRow {
  call: Call;
  patientName: string;
}

const OUTCOMES: CallOutcome[] = ["booked", "follow_up", "escalated", "no_answer", "declined"];

/**
 * The core table view (the brief: "Start with a basic table view"). Filtering
 * is client-side over the already-loaded rows — outcome, brain, and review
 * status — because the pilot's volume is small. Charts/trends come later.
 */
export function CallsTable({ rows }: { rows: CallRow[] }) {
  const [outcome, setOutcome] = useState<string>("all");
  const [brain, setBrain] = useState<string>("all");
  const [review, setReview] = useState<string>("all");

  const brains = useMemo(
    () => Array.from(new Set(rows.map((r) => r.call.brain))),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (outcome !== "all" && r.call.outcome !== outcome) return false;
        if (brain !== "all" && r.call.brain !== brain) return false;
        if (review === "reviewed" && !r.call.reviewedAt) return false;
        if (review === "pending" && r.call.reviewedAt) return false;
        return true;
      }),
    [rows, outcome, brain, review],
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <span>Calls</span>
        <div className="filters">
          <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            <option value="all">All outcomes</option>
            {OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o.replace("_", " ")}
              </option>
            ))}
          </select>
          <select value={brain} onChange={(e) => setBrain(e.target.value)}>
            <option value="all">All brains</option>
            {brains.map((b) => (
              <option key={b} value={b}>
                {brainLabel(b)}
              </option>
            ))}
          </select>
          <select value={review} onChange={(e) => setReview(e.target.value)}>
            <option value="all">All reviews</option>
            <option value="reviewed">Reviewed</option>
            <option value="pending">Pending review</option>
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Started</th>
            <th>Brain</th>
            <th>Duration</th>
            <th>Outcome</th>
            <th>Flags</th>
            <th>Reviewed</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty">
                No calls match these filters.
              </td>
            </tr>
          ) : (
            filtered.map(({ call, patientName }) => {
              const openFlags = call.flags.filter((f) => f.open).length;
              return (
                <tr key={call.id}>
                  <td>{patientName}</td>
                  <td className="mono">{fmtDateTime(call.startedAt)}</td>
                  <td>{brainLabel(call.brain)}</td>
                  <td className="mono">{fmtDuration(call.durationSec)}</td>
                  <td>
                    <OutcomeBadge outcome={call.outcome} />
                  </td>
                  <td>
                    {openFlags > 0 ? (
                      <span className="badge badge-red">{openFlags} open</span>
                    ) : (
                      <span className="mono">—</span>
                    )}
                  </td>
                  <td>
                    {call.reviewedAt ? (
                      <span className="badge badge-green">{call.reviewedBy ?? "reviewed"}</span>
                    ) : (
                      <span className="badge badge-amber">pending</span>
                    )}
                  </td>
                  <td>
                    <a href={`/calls/${call.id}`} className="link">
                      View →
                    </a>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="table-foot">
        Showing {filtered.length} of {rows.length} calls
      </div>
    </div>
  );
}
