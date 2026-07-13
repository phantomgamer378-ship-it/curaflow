"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Play, SkipForward, Trash2, Loader2 } from "lucide-react";

export function DoctorWaitingList({ waitingList }: { waitingList: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filter out any completed/cancelled/no-shows (just active waiting entries)
  const activeEntries = waitingList.filter((a: any) => a.status === "booked" || a.status === "in_consultation");

  // The up-next entry is the first 'booked' (waiting) entry
  const waitingEntriesOnly = activeEntries.filter((a: any) => a.status === "booked");

  async function handleRowAction(appointmentId: string, action: "start" | "skip" | "remove") {
    setLoadingId(appointmentId);
    setActionType(action);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/queue/${appointmentId}/${action}`, {
        method: "POST"
      });

      if (!res.ok) {
        throw new Error(res.error || `Failed to ${action} patient`);
      }

      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingId(null);
      setActionType(null);
    }
  }

  return (
    <div style={{ padding: "0" }}>
      {errorMsg && (
        <div role="alert" style={{ margin: "16px", padding: "12px", backgroundColor: "#fff5f5", color: "#dc2626", borderRadius: "10px", fontSize: "13px" }}>
          {errorMsg}
        </div>
      )}

      {activeEntries.length > 0 ? (
        <div style={{ display: "grid", gap: "0" }}>
          {activeEntries.map((apt: any) => {
            const isInConsult = apt.status === "in_consultation";
            
            // Determine if this is the "up next" entry (first in the waiting list)
            const isUpNext = waitingEntriesOnly.length > 0 && waitingEntriesOnly[0].id === apt.id;

            const isRowLoading = loadingId === apt.id;

            return (
              <div 
                key={apt.id} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "space-between", 
                  padding: "16px 24px", 
                  background: isInConsult ? "var(--mint)" : "transparent", 
                  borderBottom: "1px solid var(--line)",
                  transition: "background 160ms ease"
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "14px", color: isInConsult ? "var(--brand)" : "var(--ink)", fontWeight: 700 }}>
                    {apt.patient?.profile?.name}
                  </strong>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
                    <span>{apt.patient?.profile?.phone || "—"}</span>
                    <span>•</span>
                    <span>{new Date(apt.slotTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span className="status-pill" style={{ 
                    background: isInConsult ? "var(--brand)" : "var(--canvas)", 
                    color: isInConsult ? "white" : "var(--muted)",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontWeight: 750,
                    letterSpacing: ".05em"
                  }}>
                    T-{apt.tokenNo} {isInConsult && "(Serving)"}
                  </span>

                  {/* Row Action Controls */}
                  {!isInConsult && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      {isUpNext ? (
                        /* UP NEXT: shows single Start button */
                        <button
                          onClick={() => handleRowAction(apt.id, "start")}
                          disabled={isRowLoading}
                          className="button-primary"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", fontSize: "11px", borderRadius: "999px" }}
                        >
                          {isRowLoading && actionType === "start" ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
                          Start
                        </button>
                      ) : (
                        /* REST OF THE LIST: shows Skip and Remove buttons */
                        <>
                          <button
                            onClick={() => handleRowAction(apt.id, "skip")}
                            disabled={isRowLoading}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", fontSize: "11px", color: "var(--muted)", background: "transparent", border: "1px solid var(--line)", borderRadius: "999px", fontWeight: 600 }}
                          >
                            {isRowLoading && actionType === "skip" ? <Loader2 size={12} className="spin" /> : <SkipForward size={12} />}
                            Skip
                          </button>
                          <button
                            onClick={() => handleRowAction(apt.id, "remove")}
                            disabled={isRowLoading}
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", fontSize: "11px", backgroundColor: "transparent", color: "#dc2626", border: "1px solid #fed7d7", borderRadius: "999px", fontWeight: 600 }}
                          >
                            {isRowLoading && actionType === "remove" ? <Loader2 size={12} className="spin" /> : <Trash2 size={12} />}
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
          No patients waiting in queue.
        </div>
      )}
    </div>
  );
}
