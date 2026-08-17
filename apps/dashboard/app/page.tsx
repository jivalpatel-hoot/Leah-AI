import { computeMetrics } from "@leah/shared";
import { getCalls, getPatients, dataSource } from "@/lib/data";
import { CallsTable, type CallRow } from "@/components/CallsTable";
import { pct } from "@/lib/format";


// Read the call store fresh on every request so live data shows without a rebuild.
export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const patients = getPatients();
  const calls = getCalls();
  const m = computeMetrics(patients, calls);
  const source = dataSource();

  const nameById = new Map(patients.map((p) => [p.id, p.name]));
  const rows: CallRow[] = [...calls]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .map((call) => ({ call, patientName: nameById.get(call.patientId) ?? call.patientId }));

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pilot overview</h1>
          <p className="page-sub">
            Vein-treatment pilot · {m.totalCalls} calls · 100% human-reviewed
          </p>
        </div>
        <span className={`badge ${source === "live" ? "badge-green" : "badge-gray"}`}>
          {source === "live" ? "live data" : "sample data"}
        </span>
      </div>

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
            <a href="/flagged" className="link">
              review now →
            </a>
          </div>
        </div>
      </div>

      <CallsTable rows={rows} />
    </>
  );
}
