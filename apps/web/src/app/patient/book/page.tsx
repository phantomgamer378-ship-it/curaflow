"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CalendarDays, Clock, Stethoscope, Loader2, CheckCircle2 } from "lucide-react";

export default function BookAppointmentPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadDoctors() {
      const res = await apiFetch("/api/appointments/doctors");
      if (res.ok && res.data) {
        setDoctors(res.data);
      }
      setIsLoading(false);
    }
    loadDoctors();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const doctorId = formData.get("doctorId") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    
    // Convert to ISO-8601 string in local time zone (or UTC)
    const slotTime = new Date(`${date}T${time}:00`).toISOString();

    const res = await apiFetch("/api/appointments", {
      method: "POST",
      body: JSON.stringify({ doctorId, slotTime })
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/patient");
        router.refresh();
      }, 1500);
    } else {
      setError(res.error || "Failed to book appointment. The slot might be full.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="dashboard-page" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="dashboard-heading">
        <div>
          <span className="overline">New Appointment</span>
          <h1>Book a Visit</h1>
          <p>Select an available doctor and pick a time that works for you.</p>
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginTop: "2rem", padding: "2rem" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", color: "var(--color-slate-500)", padding: "4rem" }}>
            <Loader2 size={32} className="spin" style={{ margin: "0 auto", marginBottom: "1rem" }} />
            Loading available doctors...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--color-slate-500)", padding: "2rem" }}>No doctors are currently available.</div>
        ) : success ? (
          <div style={{ textAlign: "center", padding: "4rem 1rem", animation: "fade-in 0.3s ease-out" }}>
            <CheckCircle2 size={48} color="var(--color-green-500)" style={{ margin: "0 auto 1rem" }} />
            <h2 style={{ margin: "0 0 0.5rem 0", color: "var(--color-slate-900)" }}>Appointment Confirmed!</h2>
            <p style={{ color: "var(--color-slate-600)", margin: 0 }}>Redirecting you to your dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {error && (
              <div role="alert" style={{ padding: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontWeight: 600, color: "var(--color-slate-900)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Stethoscope size={16} /> Select a Doctor
              </label>
              <select 
                name="doctorId" 
                required 
                disabled={isSubmitting}
                style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", backgroundColor: "white", fontSize: "1rem" }}
              >
                <option value="">-- Choose a doctor --</option>
                {doctors.map((doc: any) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.profile.name} ({doc.specialty || "General"}) — {doc.clinic.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontWeight: 600, color: "var(--color-slate-900)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CalendarDays size={16} /> Date
                </label>
                <input 
                  type="date" 
                  name="date" 
                  required 
                  disabled={isSubmitting}
                  min={new Date().toISOString().split('T')[0]} // Cannot book in the past
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", fontSize: "1rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontWeight: 600, color: "var(--color-slate-900)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Clock size={16} /> Time
                </label>
                <input 
                  type="time" 
                  name="time" 
                  required 
                  disabled={isSubmitting}
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", fontSize: "1rem" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="button button-primary" 
                style={{ width: "100%", padding: "1rem", fontSize: "1.125rem", borderRadius: "8px", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
              >
                {isSubmitting && <Loader2 size={18} className="spin" />}
                {isSubmitting ? "Confirming..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
