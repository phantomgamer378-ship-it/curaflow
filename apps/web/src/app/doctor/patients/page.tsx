"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { 
  UsersRound, 
  Search, 
  CheckCircle2, 
  Loader2, 
  Calendar, 
  Phone, 
  Mail, 
  History,
  Activity
} from "lucide-react";

export default function DoctorPatientsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for the Treatment Modal
  const [treatingApt, setTreatingApt] = useState<any | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmittingTreatment, setIsSubmittingTreatment] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await apiFetch("/api/appointments");
      if (res.ok && res.data) {
        setAppointments(res.data);
      }
    } catch (e) {
      console.error("Failed to load appointments:", e);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filter appointments
  const activePatients = appointments.filter((apt: any) => 
    apt.status === "booked" || apt.status === "in_consultation"
  );

  const historyPatients = appointments.filter((apt: any) => 
    apt.status === "completed"
  );

  // Search filter
  const filteredActive = activePatients.filter((apt: any) => {
    const name = apt.patient?.profile?.name?.toLowerCase() || "";
    const email = apt.patient?.profile?.email?.toLowerCase() || "";
    const phone = apt.patient?.profile?.phone?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  const filteredHistory = historyPatients.filter((apt: any) => {
    const name = apt.patient?.profile?.name?.toLowerCase() || "";
    const email = apt.patient?.profile?.email?.toLowerCase() || "";
    const phone = apt.patient?.profile?.phone?.toLowerCase() || "";
    const diag = apt.notes?.diagnosis?.toLowerCase() || "";
    const note = apt.notes?.notes?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();
    return name.includes(query) || email.includes(query) || phone.includes(query) || diag.includes(query) || note.includes(query);
  });

  async function handleMarkTreated(e: React.FormEvent) {
    e.preventDefault();
    if (!treatingApt) return;

    setIsSubmittingTreatment(true);
    setErrorMsg(null);

    try {
      // First, start consult if it hasn't been started yet (to match status flow requirements)
      if (treatingApt.status !== "in_consultation") {
        const startRes = await apiFetch(`/api/queue/${treatingApt.id}/start`, {
          method: "POST"
        });
        if (!startRes.ok) {
          throw new Error(startRes.error || "Failed to start consultation");
        }
      }

      // Then complete consultation with diagnosis and notes
      const completeRes = await apiFetch(`/api/queue/${treatingApt.id}/complete`, {
        method: "POST",
        body: JSON.stringify({ diagnosis, notes })
      });

      if (!completeRes.ok) {
        throw new Error(completeRes.error || "Failed to mark patient as completed");
      }

      // Clean up modal and reload
      setTreatingApt(null);
      setDiagnosis("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmittingTreatment(false);
    }
  }

  return (
    <main className="dashboard-page" style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div className="dashboard-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="overline">Doctor Workspace</span>
          <h1>Patient Management & History</h1>
          <p>View registered patient details in the queue, mark them treated, and view treatment histories.</p>
        </div>
      </div>

      {/* Tabs Selector & Search */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", marginTop: "2rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button 
            onClick={() => { setActiveTab("active"); setSearchQuery(""); }}
            className={`button ${activeTab === "active" ? "button-primary" : "button-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "8px", padding: "0.5rem 1rem" }}
          >
            <Activity size={16} />
            Active Queue ({activePatients.length})
          </button>
          <button 
            onClick={() => { setActiveTab("history"); setSearchQuery(""); }}
            className={`button ${activeTab === "history" ? "button-primary" : "button-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "8px", padding: "0.5rem 1rem" }}
          >
            <History size={16} />
            Treatment History ({historyPatients.length})
          </button>
        </div>

        <div style={{ position: "relative", minWidth: "280px" }}>
          <Search size={18} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-slate-400)" }} />
          <input 
            type="text" 
            placeholder={activeTab === "active" ? "Search current queue..." : "Search history by name, diagnosis..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "0.5rem 1rem 0.5rem 2.25rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none", fontSize: "0.875rem" }}
          />
        </div>
      </div>

      <div className="dashboard-panel" style={{ marginTop: "1.5rem", padding: "1.5rem" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", color: "var(--color-slate-500)" }}>
            <Loader2 size={36} className="spin" style={{ marginBottom: "1rem" }} />
            Loading patient records...
          </div>
        ) : activeTab === "active" ? (
          /* ACTIVE QUEUE PATIENTS */
          filteredActive.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {filteredActive.map((apt: any) => (
                <div key={apt.id} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", padding: "1.25rem", background: "white", borderRadius: "12px", border: "1px solid var(--color-slate-200)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong style={{ fontSize: "1.125rem", color: "var(--color-slate-900)" }}>{apt.patient?.profile?.name}</strong>
                      <span className="badge" style={{ background: "var(--color-blue-100)", color: "var(--color-blue-700)", fontWeight: 600 }}>
                        Token T-{apt.tokenNo}
                      </span>
                      {apt.status === "in_consultation" && (
                        <span className="badge" style={{ background: "var(--color-amber-100)", color: "var(--color-amber-700)", animation: "pulse 2s infinite" }}>
                          In Consultation
                        </span>
                      )}
                    </div>
                    
                    {/* Information collected during login/registration */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", color: "var(--color-slate-600)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Mail size={14} color="var(--color-slate-400)" />
                        {apt.patient?.profile?.email}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Phone size={14} color="var(--color-slate-400)" />
                        {apt.patient?.profile?.phone || "No phone registered"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <Calendar size={14} color="var(--color-slate-400)" />
                        Slot: {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div>
                    <button 
                      onClick={() => setTreatingApt(apt)}
                      className="button button-primary"
                      style={{ 
                        backgroundColor: "var(--color-green-600)", 
                        color: "white", 
                        border: "none", 
                        borderRadius: "8px", 
                        padding: "0.6rem 1.2rem", 
                        fontWeight: 600, 
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      <CheckCircle2 size={16} />
                      Mark Treated
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-slate-500)" }}>
              <UsersRound size={48} strokeWidth={1} style={{ margin: "0 auto 1rem", color: "var(--color-slate-300)" }} />
              <p style={{ margin: 0, fontSize: "1.125rem", color: "var(--color-slate-600)" }}>No active patients found in the queue.</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-slate-400)" }}>Check back later when patients join the queue.</p>
            </div>
          )
        ) : (
          /* TREATMENT HISTORY SECTION */
          filteredHistory.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-slate-200)", color: "var(--color-slate-600)", fontWeight: 600 }}>
                    <th style={{ padding: "1rem" }}>Date / Time</th>
                    <th style={{ padding: "1rem" }}>Patient Details</th>
                    <th style={{ padding: "1rem" }}>Diagnosis</th>
                    <th style={{ padding: "1rem" }}>Treatment Notes</th>
                    <th style={{ padding: "1rem" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((apt: any) => (
                    <tr key={apt.id} style={{ borderBottom: "1px solid var(--color-slate-100)" }}>
                      <td style={{ padding: "1rem", verticalAlign: "top", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: 600 }}>{new Date(apt.slotTime).toLocaleDateString()}</div>
                        <div style={{ color: "var(--color-slate-500)", fontSize: "0.875rem" }}>
                          {new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600, color: "var(--color-slate-900)" }}>{apt.patient?.profile?.name}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.8rem", color: "var(--color-slate-500)", marginTop: "0.25rem" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Mail size={12} /> {apt.patient?.profile?.email}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <Phone size={12} /> {apt.patient?.profile?.phone || "—"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "top" }}>
                        <div style={{ 
                          display: "inline-block", 
                          padding: "0.25rem 0.5rem", 
                          background: "var(--color-slate-100)", 
                          borderRadius: "6px", 
                          fontSize: "0.875rem", 
                          fontWeight: 500,
                          color: "var(--color-slate-800)"
                        }}>
                          {apt.notes?.diagnosis || "No Diagnosis Recorded"}
                        </div>
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "top", fontSize: "0.875rem", color: "var(--color-slate-700)", maxWidth: "320px", wordBreak: "break-word" }}>
                        {apt.notes?.notes || <em style={{ color: "var(--color-slate-400)" }}>No notes added</em>}
                      </td>
                      <td style={{ padding: "1rem", verticalAlign: "top" }}>
                        <span className="badge" style={{ background: "var(--color-green-100)", color: "var(--color-green-700)", padding: "4px 8px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: 600 }}>
                          TREATED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--color-slate-500)" }}>
              <History size={48} strokeWidth={1} style={{ margin: "0 auto 1rem", color: "var(--color-slate-300)" }} />
              <p style={{ margin: 0, fontSize: "1.125rem", color: "var(--color-slate-600)" }}>No completed patient history found.</p>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--color-slate-400)" }}>Treated patients will show up here permanently.</p>
            </div>
          )
        )}
      </div>

      {/* TREATMENT FORM MODAL */}
      {treatingApt && (
        <div style={{ 
          position: "fixed", 
          inset: 0, 
          backgroundColor: "rgba(15, 23, 42, 0.6)", 
          backdropFilter: "blur(4px)",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div style={{ 
            background: "white", 
            borderRadius: "16px", 
            width: "100%", 
            maxWidth: "500px", 
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            border: "1px solid var(--color-slate-200)",
            overflow: "hidden",
            animation: "fade-in 0.2s ease-out"
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-slate-100)", background: "var(--color-slate-50)" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "var(--color-slate-900)" }}>
                Complete Consultation & Treat
              </h2>
              <p style={{ margin: "0.25rem 0 0 0", color: "var(--color-slate-500)", fontSize: "0.875rem" }}>
                Patient: <strong>{treatingApt.patient?.profile?.name}</strong> (Token T-{treatingApt.tokenNo})
              </p>
            </div>

            <form onSubmit={handleMarkTreated}>
              <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                
                {errorMsg && (
                  <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.875rem", border: "1px solid #fee2e2" }}>
                    {errorMsg}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontWeight: 600, color: "var(--color-slate-700)", fontSize: "0.875rem" }}>
                    Diagnosis Summary
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Seasonal flu, viral fever" 
                    required
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none", width: "100%", fontSize: "0.95rem" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontWeight: 600, color: "var(--color-slate-700)", fontSize: "0.875rem" }}>
                    Consultation Notes
                  </label>
                  <textarea 
                    placeholder="Provide description of symptoms, advice, prescription details..." 
                    rows={4}
                    required
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none", width: "100%", fontSize: "0.95rem", resize: "none" }}
                  />
                </div>

              </div>

              <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--color-slate-100)", backgroundColor: "var(--color-slate-50)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                <button 
                  type="button"
                  disabled={isSubmittingTreatment}
                  onClick={() => { setTreatingApt(null); setDiagnosis(""); setNotes(""); }}
                  className="button button-secondary"
                  style={{ borderRadius: "8px", padding: "0.5rem 1rem" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmittingTreatment}
                  className="button button-primary"
                  style={{ backgroundColor: "var(--color-green-600)", border: "none", borderRadius: "8px", padding: "0.5rem 1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  {isSubmittingTreatment ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                  Confirm Treatment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
