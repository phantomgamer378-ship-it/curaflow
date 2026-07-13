import { apiFetch } from "@/lib/api";
import { DoctorQueueControls } from "@/components/dashboard/doctor-queue-controls";
import { DoctorWaitingList } from "@/components/dashboard/doctor-waiting-list";
import { DoctorNoteDraftPanel } from "@/components/ai/DoctorNoteDraftPanel";
import { CalendarDays, MapPin } from "lucide-react";

export default async function DoctorQueuePage() {
  const [profileRes, appointmentsRes] = await Promise.all([
    apiFetch("/api/doctor/profile"),
    apiFetch("/api/doctor/today")
  ]);

  if (!profileRes.ok || !profileRes.data) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Profile not found or unauthorized</div>;
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
    <main style={{ padding: "45px 42px" }}>
      <header style={{ marginBottom: "38px" }}>
        <span style={{ fontSize: "11px", color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800, marginBottom: "8px", display: "block" }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </span>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "38px", fontWeight: 400, letterSpacing: "-.04em", margin: "0 0 8px" }}>
          Queue Management
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
          Control your active queue and see who is up next.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
        
        {/* Left Column: Waiting List */}
        <section className="dashboard-panel">
          <div style={{ borderBottom: "1px solid var(--line)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Waiting List ({waitingList.length})</strong>
          </div>
          <DoctorWaitingList waitingList={waitingList} />
        </section>

        {/* Right Column: Controls */}
        <div style={{ display: "grid", alignContent: "start" }}>
          <section className="dashboard-panel">
            <div style={{ borderBottom: "1px solid var(--line)", padding: "20px 24px", display: "flex", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Live Controls</strong>
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

          <section style={{ marginTop: "24px" }}>
            <DoctorNoteDraftPanel />
          </section>
        </div>

      </div>
    </main>
  );
}
