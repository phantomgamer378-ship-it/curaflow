"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function DoctorQueueControls({ 
  doctorId, 
  clinicId,
  currentToken,
  nextAppointmentId,
  nextPatientName,
  isInProgress,
  hasSessionStarted
}: { 
  doctorId: string;
  clinicId: string;
  currentToken: number;
  nextAppointmentId?: string;
  nextPatientName?: string;
  isInProgress?: boolean;
  hasSessionStarted?: boolean;
}) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"start-session" | "start" | "complete" | "no-show" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAction(endpoint: "start-session" | "start" | "complete" | "no-show") {
    if (endpoint !== "start-session" && !nextAppointmentId) return;
    
    setLoadingAction(endpoint);
    setErrorMsg(null);
    try {
      const res = await apiFetch(endpoint === "start-session" ? `/api/queue/start-session` : `/api/queue/${nextAppointmentId}/${endpoint}`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error(res.error || "Queue action failed");
      }
      
      // Optimistically clear the action since the server confirmed it
      setLoadingAction(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoadingAction(null);
    }
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ fontSize: "0.875rem", color: "var(--color-slate-500)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
          Current Token
        </div>
        <div style={{ fontSize: "3rem", fontWeight: 700, color: "var(--color-blue-900)" }}>
          {currentToken === 0 ? "Not Started" : `T-${currentToken}`}
        </div>
      </div>
      
      {errorMsg && (
        <div role="alert" style={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {errorMsg}
        </div>
      )}

      {!hasSessionStarted ? (
        <div style={{ textAlign: "center", padding: "2rem", background: "var(--color-slate-50)", borderRadius: "12px", border: "1px dashed var(--color-slate-300)" }}>
          <p style={{ marginBottom: "1rem", color: "var(--color-slate-600)" }}>You have not started your queue for today.</p>
          <button 
            onClick={() => handleAction("start-session")}
            disabled={loadingAction !== null}
            className="button button-primary" 
            style={{ padding: "0.75rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
          >
            {loadingAction === "start-session" && <Loader2 size={16} className="spin" />}
            Start Queue for Today
          </button>
        </div>
      ) : nextAppointmentId ? (
        <div style={{ background: "var(--color-slate-50)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--color-slate-200)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <small style={{ display: "block", color: "var(--color-slate-500)", marginBottom: "0.25rem", fontWeight: 500 }}>
                {isInProgress ? "IN PROGRESS" : "UP NEXT"}
              </small>
              <strong style={{ fontSize: "1.125rem", color: "var(--color-slate-900)" }}>{nextPatientName}</strong>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
             {!isInProgress ? (
               <>
                 <button 
                    onClick={() => handleAction("start")}
                    disabled={loadingAction !== null}
                    className="button button-primary" 
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    {loadingAction === "start" && <Loader2 size={16} className="spin" />}
                    Start Consult
                  </button>
                  <button 
                     onClick={() => handleAction("no-show")}
                     disabled={loadingAction !== null}
                     className="button button-secondary" 
                     style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--color-red-600)", borderColor: "var(--color-red-200)" }}
                  >
                    {loadingAction === "no-show" && <Loader2 size={16} className="spin" />}
                    No Show
                  </button>
               </>
             ) : (
                <button 
                  onClick={() => handleAction("complete")}
                  disabled={loadingAction !== null}
                  className="button button-primary" 
                  style={{ width: "100%", gridColumn: "span 2", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", backgroundColor: "var(--color-green-600)" }}
                >
                  {loadingAction === "complete" && <Loader2 size={16} className="spin" />}
                  Complete Consult
                </button>
             )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--color-slate-500)", padding: "2rem 0" }}>
          No patients waiting in queue.
        </div>
      )}
    </div>
  );
}
