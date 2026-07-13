import Link from "next/link";
import { CalendarDays, Clock3, MapPin, ChevronRight, Sparkles, Bell, AlertCircle, CheckCircle } from "lucide-react";
import { JoinQueueButton } from "@/components/queue/join-queue-button";
import { LiveQueueDisplay } from "@/components/queue/live-queue-display";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { apiFetch } from "@/lib/api";

export default async function PatientDashboard() {
  const profileRes = await apiFetch("/api/auth/profile");
  
  if (!profileRes.ok || !profileRes.data) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <h1>Not authenticated</h1>
        <Link href="/login" className="button-primary">Go to Login</Link>
      </div>
    );
  }

  const user = profileRes.data;

  // Fetch upcoming appointment
  let nextApt: any = null;
  try {
    const res = await apiFetch('/api/appointments/me');
    if (res.ok && res.data && res.data.length > 0) {
      nextApt = res.data[0];
    }
  } catch (e) {
    console.error("Failed to load upcoming appointments:", e);
  }

  // Fetch past appointments
  let pastAppointments: any = [];
  try {
    const res = await apiFetch('/api/appointments/me?past=true');
    if (res.ok && res.data) {
      pastAppointments = res.data;
    }
  } catch (e) {
    console.error("Failed to load past appointments:", e);
  }

  // Fetch notifications
  let notifications: any = [];
  try {
    const res = await apiFetch('/api/notifications/me');
    if (res.ok && res.data) {
      notifications = res.data;
    }
  } catch (e) {
    console.error("Failed to load notifications:", e);
  }

  const isToday = nextApt ? new Date(nextApt.slotTime).toDateString() === new Date().toDateString() : false;

  return (
    <main style={{ padding: "45px 42px" }}>
      
      {/* ── Welcome Header ────────────────────────────────────────────── */}
      <header style={{ marginBottom: "38px" }}>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "38px", fontWeight: 400, letterSpacing: "-.04em", margin: "0 0 8px" }}>
          Good morning, {user?.name ? user.name.split(" ")[0] : "Patient"}
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
          Here is the status of your upcoming visits and live queue positions.
        </p>
      </header>

      {/* ── Main Dashboard Grid ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
        
        {/* Left Column */}
        <div style={{ display: "grid", gap: "24px", alignContent: "start" }}>
          
          {/* Next Scheduled Appointment */}
          <section className="dashboard-panel">
            <div style={{ borderBottom: "1px solid var(--line)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Next Scheduled Appointment</strong>
            </div>
            
            {nextApt ? (
              <div style={{ padding: "24px" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                  <div style={{ background: "var(--mint)", border: "1px solid rgba(23,107,95,.15)", borderRadius: "16px", minWidth: "110px", textAlign: "center", padding: "18px 10px" }}>
                    <strong style={{ display: "block", fontFamily: "var(--serif)", fontSize: "34px", color: "var(--brand)", lineHeight: 1 }}>
                      {new Date(nextApt.slotTime).getDate()}
                    </strong>
                    <span style={{ color: "var(--brand)", textTransform: "uppercase", fontSize: "10px", fontWeight: 800, letterSpacing: ".1em", marginTop: "4px", display: "block" }}>
                      {new Date(nextApt.slotTime).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>
                  <div style={{ display: "grid", gap: "6px" }}>
                    <h2 style={{ fontFamily: "var(--serif)", fontSize: "22px", fontWeight: 500, margin: 0, color: "var(--ink)" }}>
                      Dr. {nextApt.doctor?.profile?.name || "Doctor"}
                    </h2>
                    <p style={{ margin: 0, color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}>
                      <MapPin size={14} /> {nextApt.clinic?.name || "Clinic"}
                    </p>
                    <p style={{ margin: 0, color: "var(--ink)", display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "13px" }}>
                      <Clock3 size={14} /> {new Date(nextApt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div style={{ marginTop: "10px" }}>
                      <span className="status-pill">
                        Token T-{nextApt.tokenNo}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: "50px 30px", textAlign: "center" }}>
                <div style={{ background: "var(--mint)", width: "64px", height: "64px", borderRadius: "50%", display: "grid", placeItems: "center", margin: "0 auto 16px", color: "var(--brand)" }}>
                  <CalendarDays size={28} />
                </div>
                <h3 style={{ margin: "0 0 8px", fontFamily: "var(--serif)", fontSize: "20px", fontWeight: 400 }}>No upcoming visits</h3>
                <p style={{ color: "var(--muted)", margin: "0 0 24px", fontSize: "14px" }}>You are all caught up. Schedule your next appointment when ready.</p>
                <Link href="/patient/book" className="button-primary" style={{ padding: "12px 24px", borderRadius: "999px", display: "inline-flex", background: "var(--brand)", color: "white", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
                  Book an appointment
                </Link>
              </div>
            )}
          </section>

          {/* Today's Check In / Live Queue Widget */}
          {isToday && nextApt.clinicId && (
            <section className="dashboard-panel" style={{ borderColor: "var(--brand)", boxShadow: "0 4px 20px rgba(23,107,95,.06)" }}>
              <div style={{ padding: "24px" }}>
                {nextApt.queueEntry ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                      <Sparkles size={18} color="var(--brand)" />
                      <strong style={{ fontSize: "15px", color: "var(--brand)", fontFamily: "var(--serif)" }}>Live Queue Monitor</strong>
                    </div>
                    <div style={{ background: "var(--canvas)", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--line)" }}>
                      <LiveQueueDisplay clinicId={nextApt.clinicId} initialSnapshot={{ doctors: [] }} />
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <h3 style={{ margin: "0 0 8px", fontFamily: "var(--serif)", fontSize: "22px", color: "var(--ink)" }}>You're Booked for Today</h3>
                    <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "14px", maxWidth: "340px", marginLeft: "auto", marginRight: "auto" }}>
                      Please check in and join the virtual queue when you arrive at the clinic.
                    </p>
                    <JoinQueueButton appointmentId={nextApt.id} />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recent Appointments Preview */}
          <section className="dashboard-panel">
            <div style={{ borderBottom: "1px solid var(--line)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Past Appointments</strong>
              <Link href="/patient/appointments" style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                View All <ChevronRight size={14} />
              </Link>
            </div>
            
            <div>
              {pastAppointments && pastAppointments.length > 0 ? (
                pastAppointments.slice(0, 3).map((apt: any) => {
                  let badgeBg = "var(--canvas)";
                  let badgeText = "var(--muted)";
                  if (apt.status === "completed") { badgeBg = "#e7f6ed"; badgeText = "#317458"; }
                  if (apt.status === "cancelled" || apt.status === "no_show") { badgeBg = "#fee2e2"; badgeText = "#b91c1c"; }

                  return (
                    <div key={apt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--line)" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)", minWidth: "85px" }}>
                        {new Date(apt.slotTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div style={{ flex: 1, marginLeft: "12px" }}>
                        <strong style={{ display: "block", fontSize: "14px", color: "var(--ink)" }}>Dr. {apt.doctor?.profile?.name || "Unknown"}</strong>
                        <small style={{ color: "var(--muted)", fontSize: "12px" }}>{apt.clinic?.name}</small>
                      </div>
                      <span style={{ background: badgeBg, color: badgeText, padding: "6px 10px", borderRadius: "999px", fontSize: "10px", fontWeight: 750, letterSpacing: ".05em", textTransform: "uppercase" }}>
                        {apt.status.replace("_", " ")}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                  No past appointments recorded.
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Notifications */}
        <div style={{ display: "grid", alignContent: "start" }}>
          
          <section className="dashboard-panel">
            <div style={{ borderBottom: "1px solid var(--line)", padding: "20px 24px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={16} color="var(--brand)" />
              <strong style={{ fontSize: "14px", color: "var(--ink)" }}>Notifications</strong>
            </div>
            
            <div style={{ padding: "20px 24px", display: "grid", gap: "12px" }}>
              {notifications && notifications.length > 0 ? (
                notifications.map((notif: any) => {
                  let payloadData: any = {};
                  try {
                    payloadData = typeof notif.payload === "string" ? JSON.parse(notif.payload) : notif.payload;
                  } catch (e) {
                    payloadData = { message: "Notification update received." };
                  }

                  const notifText = payloadData.message || payloadData.reason || "Notification status: " + notif.status;
                  const isErrorStatus = notif.status === "failed";

                  return (
                    <div 
                      key={notif.id} 
                      style={{ 
                        display: "flex", 
                        gap: "12px", 
                        padding: "16px", 
                        borderRadius: "14px", 
                        background: isErrorStatus ? "#fff5f5" : "var(--canvas)", 
                        border: `1px solid ${isErrorStatus ? "#fed7d7" : "transparent"}` 
                      }}
                    >
                      <div style={{ marginTop: "2px" }}>
                        {isErrorStatus ? (
                          <AlertCircle size={16} color="#dc2626" />
                        ) : (
                          <CheckCircle size={16} color="#49a671" />
                        )}
                      </div>
                      <div style={{ display: "grid", gap: "4px" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}>
                          {notifText}
                        </p>
                        <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </small>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "var(--canvas)", padding: "16px", borderRadius: "50%", color: "var(--muted)" }}>
                    <Bell size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p style={{ margin: "0 0 4px", fontSize: "14px", color: "var(--ink)", fontWeight: 600 }}>No notifications yet</p>
                    <p style={{ margin: 0, fontSize: "13px" }}>Alerts about your bookings and queue status will display here.</p>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
      
      {/* Floating AI Assistant Widget */}
      <AiAssistantPanel />
    </main>
  );
}
