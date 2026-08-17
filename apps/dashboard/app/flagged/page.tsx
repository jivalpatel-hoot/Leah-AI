import { getCalls, getPatient } from "@/lib/data";
import { FlagBadge, fmtDateTime } from "@/lib/format";


// Read the call store fresh on every request so live data shows without a rebuild.
export const dynamic = "force-dynamic";

export default function FlaggedPage() {
  const calls = getCalls();
  const flagged = calls
    .filter((c) => c.flags.length > 0)
    .sort((a, b) => {
      const ao = a.flags.some((f) => f.open) ? 0 : 1;
      const bo = b.flags.some((f) => f.open) ? 0 : 1;
      return ao - bo;
    });

  const openCount = calls.reduce(
    (n, c) => n + c.flags.filter((f) => f.open).length,
    0,
  );

  return (
    <>
      <h1 className="page-title">Flagged calls</h1>
      <p className="page-sub">
        Calls where Leah may have answered outside the approved knowledge base,
        crossed a guardrail, or handed off to a human · {openCount} open flag
        {openCount === 1 ? "" : "s"}
      </p>

      <div className="panel">
        {flagged.length === 0 ? (
          <div className="empty">No flagged calls. 🎉</div>
        ) : (
          flagged.map((c) => {
            const patient = getPatient(c.patientId);
            return (
              <div className="flag-item" key={c.id}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: 6 }}>
                    <a
                      href={`/calls/${c.id}`}
                      style={{ color: "var(--brand)", fontWeight: 600 }}
                    >
                      {patient?.name ?? c.patientId}
                    </a>{" "}
                    <span className="mono">· {fmtDateTime(c.startedAt)}</span>
                  </div>
                  {c.flags.map((f, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 6 }}
                    >
                      <FlagBadge type={f.type} open={f.open} />
                      <span style={{ color: "var(--muted)" }}>{f.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
