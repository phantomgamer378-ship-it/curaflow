"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { io, Socket } from "socket.io-client";
import { BarChart3, UsersRound, CalendarDays, Clock3 } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState("patientsSeenToday");
  const [sortDesc, setSortDesc] = useState(true);
  
  const [clinicId, setClinicId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/clinics").then(cRes => {
      if (cRes.ok && cRes.data.length > 0) {
        setClinicId(cRes.data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!clinicId) return;
    
    apiFetch(`/api/admin/analytics/live?clinicId=${clinicId}`).then(res => {
      if (res.ok) {
        setStats(res.data);
      }
      setLoading(false);
    });

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      socket.emit("join_clinic", clinicId);
    });

    socket.on("admin_stats_updated", (newStats) => {
      setStats(newStats);
    });

    return () => {
      socket.disconnect();
    };
  }, [clinicId]);

  if (loading) return <div style={{ padding: "2rem" }}>Loading analytics...</div>;
  if (!stats) return <div style={{ padding: "2rem" }}>No data available</div>;

  let sortedDoctors = [...(stats.doctorPerformance || [])];
  sortedDoctors.sort((a, b) => {
    const valA = a[sortCol];
    const valB = b[sortCol];
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>Realtime Analytics</h1>
        <p style={{ color: "#64748b" }}>Live snapshot for Today</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <StatCard icon={<CalendarDays />} label="Appointments Today" value={stats.appointmentsToday} />
        <StatCard icon={<UsersRound />} label="Patients Waiting Now" value={stats.patientsWaitingNow} />
        <StatCard icon={<BarChart3 />} label="Doctors Online" value={stats.doctorsOnline} />
        <StatCard icon={<BarChart3 />} label="No-Shows Today" value={stats.noShowsToday} />
        <StatCard icon={<Clock3 />} label="Avg Wait Time Today" value={`${stats.avgWaitTimeMinutes}m`} />
      </div>

      <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "1rem" }}>Doctor Performance (Today)</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
              <th style={{ padding: "0.75rem", cursor: "pointer" }} onClick={() => handleSort("doctorName")}>Doctor {sortCol === "doctorName" ? (sortDesc ? "↓" : "↑") : ""}</th>
              <th style={{ padding: "0.75rem", cursor: "pointer" }} onClick={() => handleSort("patientsSeenToday")}>Patients Seen Today {sortCol === "patientsSeenToday" ? (sortDesc ? "↓" : "↑") : ""}</th>
              <th style={{ padding: "0.75rem", cursor: "pointer" }} onClick={() => handleSort("avgConsultationMinutes")}>Avg Consultation Time {sortCol === "avgConsultationMinutes" ? (sortDesc ? "↓" : "↑") : ""}</th>
              <th style={{ padding: "0.75rem", cursor: "pointer" }} onClick={() => handleSort("noShowsToday")}>No-Shows Today {sortCol === "noShowsToday" ? (sortDesc ? "↓" : "↑") : ""}</th>
            </tr>
          </thead>
          <tbody>
            {sortedDoctors.map((doc: any) => (
              <tr key={doc.doctorId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.75rem" }}>{doc.doctorName}</td>
                <td style={{ padding: "0.75rem" }}>{doc.patientsSeenToday}</td>
                <td style={{ padding: "0.75rem" }}>{doc.avgConsultationMinutes}m</td>
                <td style={{ padding: "0.75rem" }}>{doc.noShowsToday}</td>
              </tr>
            ))}
            {sortedDoctors.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No active doctors today.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div style={{ backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "1rem" }}>
      <div style={{ padding: "0.75rem", backgroundColor: "#f1f5f9", borderRadius: "50%", color: "#0f172a" }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>{label}</p>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>{value}</p>
      </div>
    </div>
  );
}
