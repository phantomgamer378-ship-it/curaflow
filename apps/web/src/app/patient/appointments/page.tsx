"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { CalendarDays, Clock3, MapPin, CalendarX2 } from "lucide-react";
import Link from "next/link";

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAppointments() {
      try {
        const res = await apiFetch("/api/appointments");
        if (res.ok && res.data) {
          setAppointments(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAppointments();
  }, []);

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Your Appointments</h1>
          <p>View your upcoming and past appointments.</p>
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginTop: "2rem" }}>
        {isLoading ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-slate-200)", color: "var(--color-slate-500)" }}>
                <th style={{ padding: "1rem" }}>Date</th>
                <th style={{ padding: "1rem" }}>Time</th>
                <th style={{ padding: "1rem" }}>Doctor</th>
                <th style={{ padding: "1rem" }}>Token</th>
                <th style={{ padding: "1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-slate-100)" }}>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "80px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "60px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "120px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "40px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "24px", background: "var(--color-slate-200)", borderRadius: "12px", width: "70px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : appointments.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-slate-200)", color: "var(--color-slate-500)" }}>
                <th style={{ padding: "1rem" }}>Date</th>
                <th style={{ padding: "1rem" }}>Time</th>
                <th style={{ padding: "1rem" }}>Doctor</th>
                <th style={{ padding: "1rem" }}>Token</th>
                <th style={{ padding: "1rem" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt: any) => {
                let badgeColor = "var(--color-slate-100)";
                let badgeText = "var(--color-slate-700)";
                if (apt.status === "booked") { badgeColor = "var(--color-blue-100)"; badgeText = "var(--color-blue-700)"; }
                if (apt.status === "completed") { badgeColor = "var(--color-green-100)"; badgeText = "var(--color-green-700)"; }
                if (apt.status === "cancelled" || apt.status === "no_show") { badgeColor = "var(--color-red-100)"; badgeText = "var(--color-red-700)"; }
                
                return (
                  <tr key={apt.id} style={{ borderBottom: "1px solid var(--color-slate-100)", transition: "background-color 0.2s" }} className="table-row-hover">
                    <td style={{ padding: "1rem" }}>{new Date(apt.slotTime).toLocaleDateString()}</td>
                    <td style={{ padding: "1rem" }}>{new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: "1rem" }}>Dr. {apt.doctor?.profile?.name || "Unknown"}</td>
                    <td style={{ padding: "1rem", fontWeight: 600 }}>T-{apt.tokenNo}</td>
                    <td style={{ padding: "1rem" }}>
                      <span className="badge" style={{ background: badgeColor, color: badgeText, padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                        {apt.status.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "4rem 1rem", textAlign: "center", color: "var(--color-slate-500)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <CalendarX2 size={48} color="var(--color-slate-300)" strokeWidth={1} />
            <p style={{ margin: 0, fontSize: "1.125rem", color: "var(--color-slate-600)" }}>No appointments found.</p>
            <Link href="/patient/book" className="button button-primary" style={{ marginTop: "0.5rem" }}>Book your first appointment</Link>
          </div>
        )}
      </div>
    </main>
  );
}
