import { apiFetch } from "@/lib/api";
import { DoctorQueueControls } from "@/components/dashboard/doctor-queue-controls";
import { CalendarDays, MapPin } from "lucide-react";

export default async function DoctorQueuePage() {
  const [profileRes, appointmentsRes] = await Promise.all([
    apiFetch("/api/doctor/profile"),
    apiFetch("/api/doctor/today")
  ]);

  if (!profileRes.ok || !profileRes.data) {
    return <div style={{ padding: "2rem" }}>Profile not found or unauthorized</div>;
  }

  const doctor = profileRes.data;
  const appointments = appointmentsRes.data || [];
  
  const todayStr = new Date().toISOString().slice(0, 10);
  const session = doctor.queueSessions?.find((s: any) => s.sessionDate.startsWith(todayStr));
  const currentToken = session?.currentToken || 0;

  const inProgressApt = appointments.find((a: any) => a.status === "in_consultation");
  const nextApt = appointments.find((a: any) => a.status === "booked");
  const activeApt = inProgressApt || nextApt;

  const waitingList = appointments.filter((a: any) => 
    a.status === "booked" || a.status === "in_consultation"
  );

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="overline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h1>Queue Management</h1>
          <p>Control your active queue and see who is up next.</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem" }}>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <strong>Controls</strong>
          </div>
          <DoctorQueueControls 
            doctorId={doctor.id} 
            clinicId={doctor.clinicId}
            currentToken={currentToken}
            nextAppointmentId={activeApt?.id}
            nextPatientName={activeApt?.patient?.profile?.name}
            isInProgress={!!inProgressApt}
            hasSessionStarted={!!session}
          />
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <strong>Waiting List ({waitingList.length})</strong>
          </div>
          {waitingList.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
              {waitingList.map((apt: any) => (
                <div key={apt.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "var(--color-slate-50)", borderRadius: "8px", border: "1px solid var(--color-slate-200)" }}>
                  <div>
                    <strong style={{ display: "block" }}>{apt.patient?.profile?.name}</strong>
                    <small style={{ color: "var(--color-slate-500)" }}>
                      {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                  <div>
                    <span className="badge" style={{ background: apt.status === "in_consultation" ? "var(--color-blue-100)" : "var(--color-slate-100)", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>
                      T-{apt.tokenNo} {apt.status === "in_consultation" && "(In Progress)"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-slate-500)" }}>
              No patients waiting.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
