import { getCalls, getPatients } from "@/lib/data";
import { ConsentBadge, OutcomeBadge, fmtDateTime } from "@/lib/format";


// Read the call store fresh on every request so live data shows without a rebuild.
export const dynamic = "force-dynamic";

export default function LeadsPage() {
  const patients = getPatients();
  const calls = getCalls();

  return (
    <>
      <h1 className="page-title">Leads &amp; offers</h1>
      <p className="page-sub">
        Who was offered the AI voice agent, and who said yes or no
      </p>

      <div className="panel">
        <div className="panel-head">Patients offered Leah</div>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Condition</th>
              <th>Offered</th>
              <th>Said yes?</th>
              <th>Call outcome</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => {
              const call = calls.find((c) => c.patientId === p.id);
              return (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.condition}</td>
                  <td className="mono">{fmtDateTime(p.offeredAt)}</td>
                  <td>
                    <ConsentBadge consent={p.consent} />
                  </td>
                  <td>
                    {call ? (
                      <a href={`/calls/${call.id}`}>
                        <OutcomeBadge outcome={call.outcome} />
                      </a>
                    ) : (
                      <span className="mono">—</span>
                    )}
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
