"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Clock3, UsersRound } from "lucide-react";
import type { PublicQueueSnapshot } from "@clinic/types";

export function LiveQueueDisplay({ clinicId, initialSnapshot }: { clinicId: string; initialSnapshot: PublicQueueSnapshot }) {
  const [snapshot, setSnapshot] = useState<PublicQueueSnapshot>(initialSnapshot);
  const [isConnected, setIsConnected] = useState(false);
  const [highlightedDoctors, setHighlightedDoctors] = useState<Record<string, boolean>>({});
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchSnapshot() {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/api/queue/${clinicId}/snapshot`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          checkForUpdates(snapshot, data.data);
          setSnapshot(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch updated queue snapshot", e);
    }
  }

  function checkForUpdates(oldSnap: PublicQueueSnapshot, newSnap: PublicQueueSnapshot) {
    if (!oldSnap.doctors || !newSnap.doctors) return;
    
    const updates: Record<string, boolean> = {};
    let hasChanges = false;
    
    newSnap.doctors.forEach(newDoc => {
      const oldDoc = oldSnap.doctors?.find(d => d.doctor_id === newDoc.doctor_id);
      if (!oldDoc || oldDoc.current_token !== newDoc.current_token) {
        updates[newDoc.doctor_id] = true;
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setHighlightedDoctors(prev => ({ ...prev, ...updates }));
      setTimeout(() => {
        setHighlightedDoctors(prev => {
          const next = { ...prev };
          Object.keys(updates).forEach(k => delete next[k]);
          return next;
        });
      }, 2000);
    }
  }

  useEffect(() => {
    const socket = getSocket();
    
    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_clinic", clinicId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("queue_updated", (payload: PublicQueueSnapshot) => {
      if (payload && payload.doctors) {
        checkForUpdates(snapshot, payload);
        setSnapshot(payload);
      } else {
        fetchSnapshot();
      }
    });

    // Poll every 30s as fallback
    pollRef.current = setInterval(fetchSnapshot, 30_000);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("queue_updated");
      socket.emit("leave_clinic", clinicId);
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, snapshot]);

  return (
    <div style={{ maxWidth: "800px", margin: "4rem auto", padding: "0 1rem" }}>
      {/* Dynamic Keyframes for the pulse animation */}
      <style>{`
        @keyframes subtle-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
          50% { transform: scale(1.02); box-shadow: 0 0 20px 0 rgba(59, 130, 246, 0.5); border-color: var(--color-blue-500); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        .animate-token-update {
          animation: subtle-pulse 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-slate-900)", marginBottom: "0.5rem" }}>Live Clinic Queue</h1>
        <p style={{ color: "var(--color-slate-500)", fontSize: "1.125rem" }}>
          {isConnected ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-green-500)", display: "inline-block" }}></span>
              Connected and updating in real-time
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-amber-600)" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-amber-500)", display: "inline-block" }}></span>
              Connecting...
            </span>
          )}
        </p>
      </div>

      <div style={{ display: "grid", gap: "1.5rem" }}>
        {snapshot.doctors && snapshot.doctors.length > 0 ? (
          snapshot.doctors.map(doc => (
            <div 
              key={doc.doctor_id} 
              className={highlightedDoctors[doc.doctor_id] ? "animate-token-update" : ""}
              style={{ 
                background: "white", 
                borderRadius: "16px", 
                padding: "2rem", 
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                border: "2px solid transparent",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.3s ease"
              }}
            >
              <div>
                <h2 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem 0", color: "var(--color-slate-900)" }}>
                  Dr. {doc.doctor_name}
                </h2>
                <div style={{ display: "flex", gap: "1rem", color: "var(--color-slate-500)", fontSize: "1.125rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <UsersRound size={20} />
                    {doc.waiting_count} waiting
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.875rem", color: "var(--color-slate-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  Current Token
                </div>
                <div style={{ 
                  fontSize: "3.5rem", 
                  fontWeight: 800, 
                  color: doc.current_token > 0 ? "var(--color-blue-600)" : "var(--color-slate-300)",
                  lineHeight: 1
                }}>
                  {doc.current_token > 0 ? doc.current_token : "—"}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-slate-500)", background: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
            No queue data available for this clinic.
          </div>
        )}
      </div>
    </div>
  );
}
