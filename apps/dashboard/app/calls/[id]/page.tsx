import { notFound } from "next/navigation";
import { getCall, getPatient } from "@/lib/data";
import {
  ConsentBadge,
  FlagBadge,
  OutcomeBadge,
  brainLabel,
  fmtDateTime,
  fmtDuration,
} from "@/lib/format";

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const call = getCall(id);
  if (!call) notFound();
  const patient = getPatient(call.patientId);

  return (
    <>
      <a href="/" className="back-link">
        ← Back to overview
      </a>
      <h1 className="page-title">{patient?.name ?? call.patientId}</h1>
      <p className="page-sub">
        Call {call.id} · {patient?.condition ?? "—"}
      </p>

      <div className="panel">
        <div className="meta-row">
          <div className="meta-item">
            <div className="stat-label">Outcome</div>
            <div className="val">
              <OutcomeBadge outcome={call.outcome} />
            </div>
          </div>
          <div className="meta-item">
            <div className="stat-label">Consent</div>
            <div className="val">
              {patient ? <ConsentBadge consent={patient.consent} /> : "—"}
            </div>
          </div>
          <div className="meta-item">
            <div className="stat-label">Brain / voice</div>
            <div className="val">
              {brainLabel(call.brain)} · {call.voice}
            </div>
          </div>
          <div className="meta-item">
            <div className="stat-label">Started</div>
            <div className="val">{fmtDateTime(call.startedAt)}</div>
          </div>
          <div className="meta-item">
            <div className="stat-label">Duration</div>
            <div className="val">{fmtDuration(call.durationSec)}</div>
          </div>
          <div className="meta-item">
            <div className="stat-label">Reviewed</div>
            <div className="val">
              {call.reviewedAt
                ? `${call.reviewedBy ?? "yes"} · ${fmtDateTime(call.reviewedAt)}`
                : "Pending"}
            </div>
          </div>
        </div>
      </div>

      {call.appointment && (
        <div className="panel">
          <div className="panel-head">Appointment</div>
          <div className="meta-row">
            <div className="meta-item">
              <div className="stat-label">Proposed times</div>
              <div className="val">
                {call.appointment.proposedTimes.map(fmtDateTime).join("  ·  ")}
              </div>
            </div>
            <div className="meta-item">
              <div className="stat-label">Booked</div>
              <div className="val">
                {call.appointment.bookedTime ? (
                  <span className="badge badge-green">
                    {fmtDateTime(call.appointment.bookedTime)}
                  </span>
                ) : (
                  <span className="badge badge-amber">not yet booked</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {call.flags.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            Flags
            <span className="badge badge-red">
              {call.flags.filter((f) => f.open).length} open
            </span>
          </div>
          {call.flags.map((f, i) => (
            <div className="flag-item" key={i}>
              <FlagBadge type={f.type} open={f.open} />
              <div>{f.note}</div>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-head">Transcript</div>
        <div className="transcript">
          {call.transcript.map((turn) => (
            <div className={`turn turn-${turn.role}`} key={turn.id}>
              <div className="turn-role">
                {turn.role === "leah"
                  ? "Leah"
                  : turn.role === "patient"
                    ? "Patient"
                    : "System"}
              </div>
              <div className="turn-body">
                <div>{turn.text}</div>
                {turn.citations && turn.citations.length > 0 && (
                  <div>
                    {turn.citations.map((c) => (
                      <span className="citation" key={c.docId} title={`set ${c.set}, v${c.version}`}>
                        {c.docId}
                      </span>
                    ))}
                  </div>
                )}
                <div className="turn-time">{fmtDateTime(turn.at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
