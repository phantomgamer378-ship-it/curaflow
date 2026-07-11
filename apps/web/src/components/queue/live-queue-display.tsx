"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Clock3, UsersRound } from "lucide-react";
import type { PublicQueueSnapshot } from "@clinic/types";

export function LiveQueueDisplay({ clinicId, initialSnapshot }: { clinicId: string; initialSnapshot: PublicQueueSnapshot }) {
  const [snapshot, setSnapshot] = useState<PublicQueueSnapshot>(initialSnapshot);
  const [isConnected, setIsConnected] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  async function fetchSnapshot() {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/api/queue/${clinicId}/snapshot`);
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          if (snapshot.current_token !== data.data.current_token) {
            triggerHighlight();
          }
          setSnapshot(data.data);
        }
      }
    } catch (e) {
      console.error("Failed to fetch updated queue snapshot", e);
    }
  }

  function triggerHighlight() {
    setHighlight(true);
    setTimeout(() => setHighlight(false), 2000);
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
      if (typeof payload.current_token === "number") {
        if (snapshot.current_token !== payload.current_token) {
          triggerHighlight();
        }
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
  }, [clinicId]);

  return (
    <div style={{ maxWidth: "600px", margin: "4rem auto", padding: "0 1rem" }}>
      {/* Dynamic Keyframes for the pulse animation */}
      <style>{`
        @keyframes subtle-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); color: var(--color-blue-700); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-token-update {
          animation: subtle-pulse 0.8s cubic-bezier(0.4, 0, 0.2, 1);
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

      <div style={{ background: "white", borderRadius: "24px", padding: "3rem", boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)", textAlign: "center", border: "1px solid var(--color-slate-200)" }}>
        <small style={{ fontWeight: 600, color: "var(--color-slate-500)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Now Serving</small>
        <div key={snapshot.current_token} className={highlight ? "animate-token-update" : ""} style={{ fontSize: "6rem", fontWeight: 800, color: "var(--color-blue-600)", lineHeight: 1, margin: "1rem 0 2rem", transition: "color 0.3s" }}>
          {snapshot.current_token > 0 ? `T-${snapshot.current_token}` : "–"}
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", borderTop: "1px solid var(--color-slate-100)", paddingTop: "2rem" }}>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-slate-500)", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              <UsersRound size={16} /> Waiting
            </span>
            <strong style={{ display: "block", fontSize: "1.5rem", color: "var(--color-slate-900)" }}>{snapshot.waiting_count ?? 0}</strong>
          </div>
          <div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-slate-500)", marginBottom: "0.25rem", fontSize: "0.875rem" }}>
              <Clock3 size={16} /> Est. Wait
            </span>
            <strong style={{ display: "block", fontSize: "1.5rem", color: "var(--color-slate-900)" }}>
              {snapshot.waiting_count ? `${snapshot.waiting_count * 15} min` : "0 min"}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
