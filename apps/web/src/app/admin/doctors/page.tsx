"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Stethoscope } from "lucide-react";

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await apiFetch("/api/admin/doctors");
        if (res.ok && res.data) setDoctors(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Manage Doctors</h1>
          <p>List of all doctors in the system.</p>
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginTop: "2rem" }}>
        {isLoading ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-slate-200)", color: "var(--color-slate-500)" }}>
                <th style={{ padding: "1rem" }}>Name</th>
                <th style={{ padding: "1rem" }}>Email</th>
                <th style={{ padding: "1rem" }}>Specialty</th>
                <th style={{ padding: "1rem" }}>Clinic</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--color-slate-100)" }}>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "120px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "160px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "100px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                  <td style={{ padding: "1rem" }}><div style={{ height: "20px", background: "var(--color-slate-200)", borderRadius: "4px", width: "140px", animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : doctors.length > 0 ? (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-slate-200)", color: "var(--color-slate-500)" }}>
                <th style={{ padding: "1rem" }}>Name</th>
                <th style={{ padding: "1rem" }}>Email</th>
                <th style={{ padding: "1rem" }}>Specialty</th>
                <th style={{ padding: "1rem" }}>Clinic</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc: any) => (
                <tr key={doc.id} style={{ borderBottom: "1px solid var(--color-slate-100)", transition: "background-color 0.2s" }} className="table-row-hover">
                  <td style={{ padding: "1rem", fontWeight: 500 }}>Dr. {doc.profile?.name}</td>
                  <td style={{ padding: "1rem", color: "var(--color-slate-500)" }}>{doc.profile?.email}</td>
                  <td style={{ padding: "1rem" }}>{doc.specialty || "General"}</td>
                  <td style={{ padding: "1rem" }}>{doc.clinic?.name || "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: "4rem 1rem", textAlign: "center", color: "var(--color-slate-500)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Stethoscope size={48} color="var(--color-slate-300)" strokeWidth={1} />
            <p style={{ margin: 0, fontSize: "1.125rem", color: "var(--color-slate-600)" }}>No doctors found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
