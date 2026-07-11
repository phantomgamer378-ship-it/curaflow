"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function JoinQueueButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleJoinQueue() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch("/api/queue/join", {
        method: "POST",
        body: JSON.stringify({ appointmentId })
      });

      if (!res.ok) {
        throw new Error(res.error || "Failed to join queue");
      }
      
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {errorMsg && (
        <div style={{ marginBottom: "1rem", color: "var(--color-red-600)", fontSize: "0.875rem" }}>
          {errorMsg}
        </div>
      )}
      <button 
        onClick={handleJoinQueue}
        disabled={loading}
        className="button button-primary" 
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
      >
        {loading && <Loader2 size={16} className="spin" />}
        Join Queue Now
      </button>
    </div>
  );
}
