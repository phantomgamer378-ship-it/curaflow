"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";

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
  const [loadingAction, setLoadingAction] = useState<"start-session" | "start" | "complete" | "no-show" | "skip" | "remove" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAction(endpoint: "start-session" | "start" | "complete" | "no-show" | "skip" | "remove") {
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
      
      setLoadingAction(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoadingAction(null);
    }
  }

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ marginBottom: "28px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: "8px" }}>
          Current Token
        </div>
        <div style={{ fontSize: "52px", fontWeight: 400, fontFamily: "var(--serif)", color: "var(--brand)", lineHeight: 1 }}>
          {currentToken === 0 ? "Not Started" : `T-${currentToken}`}
        </div>
      </div>
      
      {errorMsg && (
        <div role="alert" style={{ marginBottom: "20px", padding: "16px", backgroundColor: "#fff5f5", color: "#dc2626", borderRadius: "12px", border: "1px solid #fed7d7", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={16} />
          {errorMsg}
        </div>
      )}

      {!hasSessionStarted ? (
        <div style={{ textAlign: "center", padding: "28px 20px", background: "var(--canvas)", borderRadius: "14px", border: "1px dashed var(--line)" }}>
          <p style={{ margin: "0 0 16px", color: "var(--muted)", fontSize: "14px" }}>You have not started your queue for today.</p>
          <button 
            onClick={() => handleAction("start-session")}
            disabled={loadingAction !== null}
            className="button-primary" 
            style={{ padding: "12px 24px", display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "999px" }}
          >
            {loadingAction === "start-session" && <Loader2 size={16} className="spin" />}
            Start Queue for Today
          </button>
        </div>
      ) : nextAppointmentId ? (
        <div style={{ background: "var(--cream)", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <span className="status-pill" style={{ display: "inline-block", marginBottom: "8px", background: isInProgress ? "var(--mint)" : "var(--canvas)", color: isInProgress ? "var(--brand)" : "var(--muted)" }}>
                {isInProgress ? "IN PROGRESS" : "UP NEXT"}
              </span>
              <strong style={{ display: "block", fontSize: "20px", fontFamily: "var(--serif)", color: "var(--ink)", fontWeight: 500 }}>{nextPatientName}</strong>
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
             {!isInProgress ? (
               <>
                 <button 
                    onClick={() => handleAction("start")}
                    disabled={loadingAction !== null}
                    className="button-primary" 
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "999px" }}
                 >
                   {loadingAction === "start" && <Loader2 size={16} className="spin" />}
                   Start Consultation
                 </button>
                 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                   <button 
                      onClick={() => handleAction("skip")}
                      disabled={loadingAction !== null}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "transparent", border: "1.5px solid var(--line)", borderRadius: "999px", color: "var(--muted)", fontWeight: 600, fontSize: "13px" }}
                   >
                     {loadingAction === "skip" && <Loader2 size={14} className="spin" />}
                     Skip
                   </button>
                   <button 
                      onClick={() => handleAction("no-show")}
                      disabled={loadingAction !== null}
                      style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "transparent", border: "1.5px solid #fed7d7", borderRadius: "999px", color: "#dc2626", fontWeight: 600, fontSize: "13px" }}
                   >
                     {loadingAction === "no-show" && <Loader2 size={14} className="spin" />}
                     No Show
                   </button>
                 </div>
              </>
            ) : (
                <>
                  <button 
                    onClick={() => handleAction("complete")}
                    disabled={loadingAction !== null}
                    className="button-primary" 
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "14px", borderRadius: "999px", backgroundColor: "#317458", borderColor: "#317458" }}
                  >
                    {loadingAction === "complete" && <Loader2 size={16} className="spin" />}
                    Complete Treatment
                  </button>
                  <button 
                    onClick={() => handleAction("remove")}
                    disabled={loadingAction !== null}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", padding: "12px", background: "transparent", border: "1.5px solid #fed7d7", borderRadius: "999px", color: "#dc2626", fontWeight: 600, fontSize: "13px" }}
                  >
                    {loadingAction === "remove" && <Loader2 size={14} className="spin" />}
                    Remove Patient
                  </button>
                </>
             )}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "var(--muted)", padding: "30px 0", fontSize: "14px" }}>
          <div style={{ background: "var(--canvas)", width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
            <span style={{ fontSize: "24px" }}>🎉</span>
          </div>
          No patients waiting.
        </div>
      )}
    </div>
  );
}
