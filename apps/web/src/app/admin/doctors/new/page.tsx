"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AddDoctorPage({ params }: any) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      specialty: formData.get("specialty"),
      phone: formData.get("phone"),
      slotDurationMin: parseInt(formData.get("slotDurationMin") as string || "15"),
      maxPatientsPerSlot: 1,
      // Hardcode clinic ID for now since we don't have a clinic picker
      clinicId: "00000000-0000-0000-0000-000000000000" // We'll fix this in the API route
    };

    try {
      const res = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Failed to create doctor");
      }

      router.push("/admin/doctors");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <Link href="/admin/doctors" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-slate-500)", textDecoration: "none", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
            <ArrowLeft size={14} /> Back to Doctors
          </Link>
          <h1>Add Doctor</h1>
          <p>Create a new doctor profile and send them an invite.</p>
        </div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: "2rem", maxWidth: "600px" }}>
        <section className="dashboard-panel" style={{ padding: "2rem" }}>
          {error && (
            <div style={{ padding: "1rem", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", marginBottom: "1.5rem" }}>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-slate-700)" }}>Full Name</label>
              <input name="name" type="text" required placeholder="Dr. Sarah Smith" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-slate-700)" }}>Email Address</label>
              <input name="email" type="email" required placeholder="doctor@clinic.com" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)" }} />
              <small style={{ color: "var(--color-slate-500)" }}>They will receive a secure login link at this address.</small>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-slate-700)" }}>Specialty</label>
              <input name="specialty" type="text" placeholder="e.g. Cardiology, Paediatrics" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)" }} />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontWeight: 500, fontSize: "0.875rem", color: "var(--color-slate-700)" }}>Slot Duration (minutes)</label>
              <input name="slotDurationMin" type="number" defaultValue="15" min="5" max="120" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)" }} />
            </div>

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <Link href="/admin/doctors" className="button button-light">Cancel</Link>
              <button type="submit" className="button button-primary" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Doctor"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
