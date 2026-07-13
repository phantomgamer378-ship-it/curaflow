import { apiFetch } from "@/lib/api";
import { 
  UsersRound, 
  CalendarDays, 
  Stethoscope, 
  Clock, 
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import { AdminInsightsPanel } from "@/components/ai/AdminInsightsPanel";

export default async function AdminDashboard() {
  const res = await apiFetch("/api/admin/analytics");
  const data = res.data || {
    totalAppointments: 0,
    appointmentsToday: 0,
    doctorsOnline: 0,
    completedCount: 0,
    cancelledCount: 0,
    noShowCount: 0,
    noShowRate7Days: 0,
    completionRate: 0,
    cancellationRate: 0,
    noShowRate: 0,
    avgWaitTimeToday: 0,
    doctorsList: [],
    recentAuditLogs: []
  };

  return (
    <main style={{ padding: "45px 42px" }}>
      <header style={{ marginBottom: "38px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800, marginBottom: "8px", display: "block" }}>
            Admin Workspace
          </span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "38px", fontWeight: 400, letterSpacing: "-.04em", margin: "0 0 8px", color: "var(--ink)" }}>
            Clinic Overview
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
            Today's operational metrics across all doctors.
          </p>
        </div>
        <div>
           <Link href="/admin/queue-monitor" className="button-primary" style={{ padding: "12px 24px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600 }}>
             Live Queue Monitor <ArrowUpRight size={16} />
           </Link>
        </div>
      </header>

      {/* ── STATS ROW ────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "32px" }}>
        <article style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--mint)", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
            <CalendarDays size={20} />
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Total Patients Today</div>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "32px", fontWeight: 500, color: "var(--ink)", display: "block", lineHeight: 1 }}>{data.appointmentsToday}</strong>
          </div>
        </article>

        <article style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--mint)", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Avg Wait Time</div>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "32px", fontWeight: 500, color: "var(--ink)", display: "block", lineHeight: 1 }}>{data.avgWaitTimeToday} <span style={{ fontSize: "18px", color: "var(--muted)" }}>m</span></strong>
          </div>
        </article>

        <article style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "var(--mint)", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
            <Stethoscope size={20} />
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Doctors Active</div>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "32px", fontWeight: 500, color: "var(--ink)", display: "block", lineHeight: 1 }}>{data.doctorsOnline}</strong>
          </div>
        </article>

        <article style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#fee2e2", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            <UsersRound size={20} />
          </div>
          <div>
            <div style={{ color: "var(--muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>No-shows (Today)</div>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "32px", fontWeight: 500, color: "var(--ink)", display: "block", lineHeight: 1 }}>{data.noShowCount}</strong>
          </div>
        </article>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "24px" }}>
        
        {/* Left Side: Live Queues Table */}
        <section className="dashboard-panel" style={{ background: "white", borderRadius: "16px", border: "1px solid var(--line)", overflow: "hidden" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "20px", color: "var(--ink)", fontWeight: 500 }}>Live Queues by Doctor</strong>
            <Link href="/admin/doctors" style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              View All Doctors <ChevronRight size={14} />
            </Link>
          </div>
          
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--canvas)", borderBottom: "1px solid var(--line)" }}>
                  <th style={{ padding: "16px 24px", color: "var(--muted)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Doctor</th>
                  <th style={{ padding: "16px 24px", color: "var(--muted)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "16px 24px", color: "var(--muted)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Wait Count</th>
                  <th style={{ padding: "16px 24px", color: "var(--muted)", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.doctorsList && data.doctorsList.length > 0 ? (
                  data.doctorsList.map((doc: any) => (
                    <tr key={doc.id} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={{ padding: "16px 24px" }}>
                        <strong style={{ display: "block", color: "var(--ink)", fontSize: "14px" }}>Dr. {doc.profile?.name}</strong>
                        <span style={{ color: "var(--muted)", fontSize: "12px" }}>{doc.specialty || "General"}</span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {doc.isOnline ? (
                          <span className="status-pill" style={{ background: "var(--mint)", color: "var(--brand)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                            <span className="live-dot" style={{ display: "inline-block", marginRight: "6px", width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)" }} />
                            Live
                          </span>
                        ) : (
                          <span className="status-pill" style={{ background: "var(--canvas)", color: "var(--muted)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                            Offline
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{doc.isOnline ? "Active Queue" : "—"}</span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                         <Link href={`/admin/doctors/${doc.id}`} style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                           Manage
                         </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
                      No doctors registered.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right Side: Recent Activity Timeline */}
        <section className="dashboard-panel" style={{ background: "white", borderRadius: "16px", border: "1px solid var(--line)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontFamily: "var(--serif)", fontSize: "20px", color: "var(--ink)", fontWeight: 500 }}>Recent Activity</strong>
          </div>
          
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, background: "var(--canvas)" }}>
            {data.recentAuditLogs && data.recentAuditLogs.length > 0 ? (
              data.recentAuditLogs.map((log: any, index: number) => (
                <div key={log.id} style={{ display: "flex", gap: "16px", position: "relative" }}>
                  {/* Timeline Line */}
                  {index !== data.recentAuditLogs.length - 1 && (
                    <div style={{ position: "absolute", left: "5px", top: "20px", bottom: "-20px", width: "1px", background: "var(--line)" }} />
                  )}
                  {/* Timeline Dot */}
                  <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "var(--mint)", border: "2px solid var(--brand)", flexShrink: 0, marginTop: "4px", position: "relative", zIndex: 1 }} />
                  
                  {/* Content */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", paddingBottom: index !== data.recentAuditLogs.length - 1 ? "12px" : "0" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <strong style={{ fontSize: "13px", color: "var(--ink)" }}>{log.action.replaceAll("_", " ")}</strong>
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                       {log.profile?.name ? `${log.profile.name} updated ` : "System updated "} {log.resourceType}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "var(--muted)", padding: "20px 0", fontSize: "14px" }}>
                No recent activity.
              </div>
            )}
          </div>
          
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)", background: "white", textAlign: "center" }}>
            <Link href="/admin/audit-logs" style={{ color: "var(--brand)", fontSize: "13px", fontWeight: 700 }}>
              View All Logs
            </Link>
          </div>
        </section>
        
        {/* Rightmost Side: AI Insights Assistant */}
        <section style={{ display: "flex", flexDirection: "column" }}>
          <AdminInsightsPanel />
        </section>

      </div>
    </main>
  );
}
