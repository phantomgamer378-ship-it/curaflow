import { apiFetch } from "@/lib/api";
import { UsersRound, CalendarDays, ClipboardList, Stethoscope } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const res = await apiFetch("/api/admin/analytics");
  const data = res.data || {
    totalAppointments: 0,
    completedCount: 0,
    cancelledCount: 0,
    noShowCount: 0,
    completionRate: 0,
    cancellationRate: 0,
    noShowRate: 0,
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <span className="overline">Administration</span>
          <h1>Clinic Overview</h1>
          <p>System-wide analytics and management.</p>
        </div>
      </div>

      <div className="dashboard-stats" style={{ marginTop: "2rem" }}>
        <article>
          <span className="stat-icon blue"><CalendarDays size={20} /></span>
          <div>
            <small>Total Appointments</small>
            <strong>{data.totalAppointments}</strong>
            <span>Lifetime bookings</span>
          </div>
        </article>
        <article>
          <span className="stat-icon green"><ClipboardList size={20} /></span>
          <div>
            <small>Completion Rate</small>
            <strong>{data.completionRate}%</strong>
            <span>{data.completedCount} completed</span>
          </div>
        </article>
        <article>
          <span className="stat-icon sand"><UsersRound size={20} /></span>
          <div>
            <small>No-Show Rate</small>
            <strong>{data.noShowRate}%</strong>
            <span>{data.noShowCount} no-shows</span>
          </div>
        </article>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem" }}>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <strong>Quick Links</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
            <Link href="/admin/doctors" className="button button-secondary" style={{ justifyContent: "flex-start", gap: "0.5rem" }}>
              <Stethoscope size={16} /> Manage Doctors
            </Link>
            <Link href="/admin/patients" className="button button-secondary" style={{ justifyContent: "flex-start", gap: "0.5rem" }}>
              <UsersRound size={16} /> Manage Patients
            </Link>
            <Link href="/admin/appointments" className="button button-secondary" style={{ justifyContent: "flex-start", gap: "0.5rem" }}>
              <CalendarDays size={16} /> All Appointments
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
