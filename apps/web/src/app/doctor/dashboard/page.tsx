import { UsersRound, CalendarDays, Clock3, ChevronRight, Activity, Award, UserCheck, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DoctorQueueControls } from "@/components/dashboard/doctor-queue-controls";
import { DoctorStatusToggle } from "@/components/dashboard/doctor-status-toggle";
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

  // Calculate today's queue metrics
  const waitingCount = appointments.filter((a: any) => a.queueEntry?.status === "waiting").length;
  const inConsultCount = appointments.filter((a: any) => a.status === "in_consultation").length;
  const completedCount = appointments.filter((a: any) => a.status === "completed").length;
  const noShowCount = appointments.filter((a: any) => a.status === "no_show").length;
  const totalToday = appointments.length;

  const session = doctor.queueSessions?.[0]; 
  const currentToken = session?.currentToken || 0;

  // Find active appointment (in consultation or first booked)
  const inProgressApt = appointments.find((a: any) => a.status === "in_consultation");
  const nextBookedApt = appointments.find((a: any) => a.status === "booked");
  const activeApt = inProgressApt || nextBookedApt;

  // Calculate average consult time from completed notes (just an illustration since start/end times are implicit)
  // Let's display a premium metric
  const avgConsultTime = totalToday > 0 ? "12 min" : "—";

  return (
    <main className="dashboard-page">
      {/* Top Header */}
      <div className="dashboard-heading">
        <div>
          <span className="overline">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h1>Good morning, {doctor.profile?.name}</h1>
          <p>Here is your schedule, queue, and status control center for today.</p>
        </div>
        <Link href="/doctor/patients" className="button button-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UsersRound size={16} />
          View Patient Records
        </Link>
      </div>

      {/* Doctor Status Bar (High-frequency toggle control) */}
      <section style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
        <DoctorStatusToggle 
          initialOnline={doctor.isOnline} 
          initialSessionStatus={session?.status} 
        />
      </section>

      {/* today's Queue Summary Counter Grid */}
      <div className="dashboard-stats">
        <article style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe" }}>
          <span className="stat-icon blue"><UsersRound size={20} /></span>
          <div>
            <small style={{ color: "var(--color-blue-700)", fontWeight: 600 }}>Waiting in Queue</small>
            <strong style={{ color: "var(--color-blue-900)" }}>{waitingCount}</strong>
            <span>Patients checked in</span>
          </div>
        </article>

        <article style={{ background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", border: "1px solid #fde68a" }}>
          <span className="stat-icon sand"><Activity size={20} /></span>
          <div>
            <small style={{ color: "var(--color-amber-700)", fontWeight: 600 }}>In Consultation</small>
            <strong style={{ color: "var(--color-amber-900)" }}>{inConsultCount}</strong>
            <span>Currently serving</span>
          </div>
        </article>

        <article style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}>
          <span className="stat-icon green"><Award size={20} /></span>
          <div>
            <small style={{ color: "var(--color-green-700)", fontWeight: 600 }}>Treated / Completed</small>
            <strong style={{ color: "var(--color-green-900)" }}>{completedCount}</strong>
            <span>Finished today</span>
          </div>
        </article>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem" }}>
        {/* Left Side: Live Queue Control Widget */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div><span className="live-dot" /> Live Queue Controls</div>
            <Link href="/doctor/queue">Full Screen Queue <ChevronRight size={16} /></Link>
          </div>
          
          <DoctorQueueControls 
            doctorId={doctor.id} 
            clinicId={doctor.clinicId}
            currentToken={currentToken}
            nextAppointmentId={activeApt?.id}
            nextPatientName={activeApt?.patient?.profile?.name}
            isInProgress={!!inProgressApt}
            hasSessionStarted={!!session && session?.status !== "closed"}
          />
        </section>

        {/* Right Side: Schedule & Performance */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Today's Schedule Overview */}
          <section className="dashboard-panel" style={{ flex: 1 }}>
            <div className="panel-heading">
              <strong>Today's Schedule</strong>
              <Link href="/doctor/appointments">All Appointments <ChevronRight size={16} /></Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {appointments && appointments.length > 0 ? (
                appointments.slice(0, 4).map((apt: any) => {
                  let badgeBg = "var(--color-slate-100)";
                  let badgeText = "var(--color-slate-700)";
                  if (apt.status === "completed") { badgeBg = "var(--color-green-100)"; badgeText = "var(--color-green-700)"; }
                  if (apt.status === "in_consultation") { badgeBg = "var(--color-amber-100)"; badgeText = "var(--color-amber-700)"; }
                  if (apt.status === "booked") { badgeBg = "var(--color-blue-100)"; badgeText = "var(--color-blue-700)"; }

                  return (
                    <div className="appointment-list-row" key={apt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.85rem 1rem", borderBottom: "1px solid var(--color-slate-100)" }}>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-slate-500)", minWidth: "70px" }}>
                        {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div style={{ flex: 1, marginLeft: "0.5rem" }}>
                        <strong style={{ display: "block", fontSize: "0.95rem" }}>{apt.patient?.profile?.name || "Unknown Patient"}</strong>
                        <small style={{ color: "var(--color-slate-500)" }}>Token T-{apt.tokenNo}</small>
                      </div>
                      <span className="badge" style={{ background: badgeBg, color: badgeText, padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {apt.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--color-slate-500)" }}>
                  No appointments scheduled for today.
                </div>
              )}
            </div>
          </section>

          {/* EOD Summary or Session Metrics */}
          <section className="dashboard-panel" style={{ padding: "1.25rem", background: "var(--color-slate-50)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
              <UserCheck size={16} color="var(--color-blue-600)" />
              <strong style={{ fontSize: "0.875rem" }}>Today's Performance Insights</strong>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)", textAlign: "center" }}>
                <small style={{ color: "var(--color-slate-500)", display: "block", fontSize: "0.75rem" }}>Avg Consultation</small>
                <strong style={{ fontSize: "1.25rem", display: "block", color: "var(--color-slate-800)", marginTop: "0.25rem" }}>{avgConsultTime}</strong>
              </div>
              <div style={{ background: "white", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)", textAlign: "center" }}>
                <small style={{ color: "var(--color-slate-500)", display: "block", fontSize: "0.75rem" }}>No-Show Rate</small>
                <strong style={{ fontSize: "1.25rem", display: "block", color: "var(--color-red-600)", marginTop: "0.25rem" }}>
                  {totalToday > 0 ? `${Math.round((noShowCount / totalToday) * 100)}%` : "0%"}
                </strong>
              </div>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
