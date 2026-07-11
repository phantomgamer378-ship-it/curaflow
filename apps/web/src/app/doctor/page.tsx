import { Plus, UsersRound, CalendarDays, Clock3, ChevronRight, Check } from "lucide-react";
import Link from "next/link";
import { DoctorQueueControls } from "@/components/dashboard/doctor-queue-controls";
import { apiFetch } from "@/lib/api";

export default async function DoctorOverview() {
  const [profileRes, appointmentsRes] = await Promise.all([
    apiFetch("/api/doctor/profile"),
    apiFetch("/api/doctor/today")
  ]);

  if (!profileRes.ok || !profileRes.data) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-heading">
          <div>
            <h1>Profile setup required or Unauthorized</h1>
            <p>Your doctor profile is not fully configured or your session expired.</p>
          </div>
        </div>
      </main>
    );
  }

  const doctor = profileRes.data;
  const appointments = appointmentsRes.data || [];

  const bookedCount = appointments.filter((a: any) => a.status === "booked").length || 0;
  
  // Note: Queue sessions could be added to the Express API. For now, use derived data.
  const session = doctor.queueSessions?.[0]; // If the backend includes it
  const waitingCount = appointments.filter((a: any) => a.queueEntry?.status === "waiting").length;
  const currentToken = session?.currentToken || 0;

  // Find next patient
  const nextAppointment = appointments.find((a: any) => a.status === "booked");

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="overline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h1>Good morning, {doctor.profile?.name}</h1>
          <p>Here is your schedule and queue for today.</p>
        </div>
        <Link href="/doctor/queue" className="button button-primary">
          Open my queue
        </Link>
      </div>

      <div className="dashboard-stats">
        <article>
          <span className="stat-icon green"><CalendarDays size={20} /></span>
          <div>
            <small>Today's Appointments</small>
            <strong>{appointments.length || 0}</strong>
            <span>{bookedCount} remaining</span>
          </div>
        </article>
        <article>
          <span className="stat-icon blue"><UsersRound size={20} /></span>
          <div>
            <small>Checked in (Waiting)</small>
            <strong>{waitingCount || 0}</strong>
            <span>Patients in clinic</span>
          </div>
        </article>
        <article>
          <span className="stat-icon sand"><Clock3 size={20} /></span>
          <div>
            <small>Current Token</small>
            <strong>{currentToken}</strong>
            <span>Currently serving</span>
          </div>
        </article>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem" }}>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><span className="live-dot" /> Live Queue</div>
            <Link href="/doctor/queue">Manage Queue <ChevronRight size={16} /></Link>
          </div>
          
          <DoctorQueueControls 
            doctorId={doctor.id} 
            clinicId={doctor.clinicId}
            currentToken={currentToken}
            nextAppointmentId={nextAppointment?.id}
            nextPatientName={nextAppointment?.patient?.profile?.name}
          />
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <strong>Upcoming Schedule</strong>
            <Link href="/doctor/appointments">All <ChevronRight size={16} /></Link>
          </div>
          
          {appointments && appointments.length > 0 ? (
            appointments.slice(0, 4).map((apt: any) => (
              <div className="appointment-list-row" key={apt.id}>
                <span>{new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <div>
                  <strong>{apt.patient?.profile?.name || "Unknown Patient"}</strong>
                  <small>{apt.status.replace("_", " ")}</small>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-slate-500)" }}>
              No appointments scheduled for today.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
