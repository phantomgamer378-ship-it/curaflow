import { apiFetch } from "@/lib/api";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { LiveQueueDisplay } from "@/components/queue/live-queue-display";
import { JoinQueueButton } from "@/components/queue/join-queue-button";

export default async function PatientOverview() {
  const res = await apiFetch("/api/appointments");
  const appointments = res.data || [];
  
  const today = new Date().toISOString().slice(0, 10);
  
  const upcoming = appointments.filter((a: any) => 
    new Date(a.slotTime) >= new Date() && 
    !["cancelled", "completed", "no_show"].includes(a.status)
  ).sort((a: any, b: any) => new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime());

  const nextApt = upcoming[0];
  const isToday = nextApt && new Date(nextApt.slotTime).toISOString().slice(0, 10) === today;

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="overline">Patient Portal</span>
          <h1>Welcome back</h1>
          <p>Manage your appointments and track your queue status.</p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/patient/appointments" className="button button-secondary">
            View All
          </Link>
          <Link href="/patient/book" className="button button-primary">
            Book Appointment
          </Link>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem" }}>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <strong>Next Appointment</strong>
          </div>
          
          {nextApt ? (
            <div style={{ padding: "1rem 0" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ background: "var(--color-slate-100)", padding: "1rem", borderRadius: "12px", textAlign: "center", minWidth: "100px" }}>
                  <strong style={{ display: "block", fontSize: "1.5rem", color: "var(--color-blue-900)" }}>
                    {new Date(nextApt.slotTime).getDate()}
                  </strong>
                  <small style={{ color: "var(--color-slate-500)", textTransform: "uppercase" }}>
                    {new Date(nextApt.slotTime).toLocaleString('default', { month: 'short' })}
                  </small>
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0" }}>Dr. {nextApt.doctor?.profile?.name || "Doctor"}</h3>
                  <p style={{ margin: 0, color: "var(--color-slate-500)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={14} /> {nextApt.clinic?.name || "Clinic"}
                  </p>
                  <p style={{ margin: "0.5rem 0 0 0", color: "var(--color-slate-900)", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500 }}>
                    <Clock3 size={16} /> {new Date(nextApt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div style={{ marginTop: "0.5rem" }}>
                    <span className="badge" style={{ background: "var(--color-blue-100)", color: "var(--color-blue-700)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                      Token: {nextApt.tokenNo}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--color-slate-500)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <CalendarDays size={48} color="var(--color-slate-300)" strokeWidth={1} />
              <p style={{ margin: 0, fontSize: "1.125rem", color: "var(--color-slate-600)" }}>You have no upcoming appointments.</p>
              <Link href="/patient/book" className="button button-primary" style={{ marginTop: "0.5rem" }}>Book your next visit</Link>
            </div>
          )}
        </section>

        {isToday && nextApt.clinicId && (
          <section className="dashboard-panel">
            {nextApt.queueEntry ? (
              <LiveQueueDisplay 
                clinicId={nextApt.clinicId} 
                initialSnapshot={{ current_token: 0, waiting_count: 0 }} 
              />
            ) : (
              <div style={{ padding: "1.5rem", textAlign: "center" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--color-slate-900)" }}>Check In</h3>
                <p style={{ margin: "0 0 1rem 0", color: "var(--color-slate-600)" }}>You have an appointment today. Please join the queue when you arrive.</p>
                <JoinQueueButton appointmentId={nextApt.id} />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
