import { computeMetrics } from "@leah/shared";
import { getCalls, getPatients, getPatient } from "@/lib/mock-data";
import {
  OutcomeBadge,
  brainLabel,
  fmtDateTime,
  fmtDuration,
  pct,
} from "@/lib/format";

export default function OverviewPage() {
  const patients = getPatients();
  const calls = getCalls();
  const m = computeMetrics(patients, calls);

  const sorted = [...calls].sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <>
      <h1 className="page-title">Pilot overview</h1>
      <p className="page-sub">
        Vein-treatment pilot · {m.totalCalls} calls · 100% human-reviewed
      </p>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-label">Conversion rate</div>
          <div className="stat-value">{pct(m.conversionRate)}</div>
          <div className="stat-hint">
            {m.booked} booked of {m.accepted} accepted
          </div>
          <div className="progress">
            <span style={{ width: pct(m.conversionRate) }} />
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Offered</div>
          <div className="stat-value">{m.offered}</div>
          <div className="stat-hint">
            {m.accepted} yes · {m.declined} no
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Booked</div>
          <div className="stat-value">{m.booked}</div>
          <div className="stat-hint">appointments scheduled</div>
        </div>
        <div className="stat">
          <div className="stat-label">Follow-ups</div>
          <div className="stat-value">{m.followUp}</div>
          <div className="stat-hint">awaiting a call back</div>
        </div>
        <div className="stat">
          <div className="stat-label">Escalated</div>
          <div className="stat-value">{m.escalated}</div>
          <div className="stat-hint">handed to a human</div>
        </div>
        <div className="stat">
          <div className="stat-label">Flagged for review</div>
          <div className="stat-value">{m.flaggedCalls}</div>
          <div className="stat-hint">
            <a href="/flagged" style={{ color: "var(--brand)", fontWeight: 600 }}>
              review now →
            </a>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">All calls</div>
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
            {sorted.map((c) => {
              const patient = getPatient(c.patientId);
              const openFlags = c.flags.filter((f) => f.open).length;
              return (
                <tr key={c.id}>
                  <td>{patient?.name ?? c.patientId}</td>
                  <td className="mono">{fmtDateTime(c.startedAt)}</td>
                  <td>{brainLabel(c.brain)}</td>
                  <td className="mono">{fmtDuration(c.durationSec)}</td>
                  <td>
                    <OutcomeBadge outcome={c.outcome} />
                  </td>
                  <td>
                    {openFlags > 0 ? (
                      <span className="badge badge-red">{openFlags} open</span>
                    ) : (
                      <span className="mono">—</span>
                    )}
                  </td>
                  <td>
                    {c.reviewedAt ? (
                      <span className="badge badge-green">
                        {c.reviewedBy ?? "reviewed"}
                      </span>
                    ) : (
                      <span className="badge badge-amber">pending</span>
                    )}
                  </td>
                  <td>
                    <a
                      href={`/calls/${c.id}`}
                      style={{ color: "var(--brand)", fontWeight: 600 }}
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
