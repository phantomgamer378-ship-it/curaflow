"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Loader2, Play, Pause, Power, CheckCircle } from "lucide-react";

export function DoctorStatusToggle({
  initialOnline,
  initialSessionStatus
}: {
  initialOnline: boolean;
  initialSessionStatus?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Derive status
  let statusText = "Offline";
  let statusColor = "var(--color-slate-500)";
  let dotColor = "#64748b";

  if (initialOnline) {
    if (initialSessionStatus === "paused") {
      statusText = "On Break / Paused";
      statusColor = "var(--color-amber-600)";
      dotColor = "#f59e0b";
    } else {
      statusText = "Online & Serving";
      statusColor = "var(--color-green-600)";
      dotColor = "#22c55e";
    }
  }

  async function handleStatusChange(action: "online" | "pause" | "offline") {
    setIsPending(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/doctor/status/${action}`, {
        method: "POST"
      });

      if (!res.ok) {
        throw new Error(res.error || `Failed to set status to ${action}`);
      }

      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%" }}>
      {errorMsg && (
        <div style={{ padding: "0.75rem", backgroundColor: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.875rem" }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", background: "white", borderRadius: "12px", border: "1px solid var(--color-slate-200)", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: dotColor, display: "inline-block", boxShadow: `0 0 8px ${dotColor}` }}></span>
          <span style={{ fontSize: "1rem", fontWeight: 600, color: statusColor }}>
            Status: {statusText}
          </span>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          {/* Go Online Button */}
          {(!initialOnline || initialSessionStatus === "paused") && (
            <button
              onClick={() => handleStatusChange("online")}
              disabled={isPending}
              className="button button-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.875rem" }}
            >
              {isPending ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
              Go Online
            </button>
          )}

          {/* Pause Button */}
          {initialOnline && initialSessionStatus !== "paused" && (
            <button
              onClick={() => handleStatusChange("pause")}
              disabled={isPending}
              className="button button-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "var(--color-amber-700)", borderColor: "var(--color-amber-200)" }}
            >
              {isPending ? <Loader2 size={15} className="spin" /> : <Pause size={15} />}
              Pause Queue
            </button>
          )}

          {/* Go Offline / End Day Button */}
          {initialOnline && (
            <button
              onClick={() => handleStatusChange("offline")}
              disabled={isPending}
              className="button button-secondary"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 1rem", fontSize: "0.875rem", color: "var(--color-red-600)", borderColor: "var(--color-red-200)" }}
            >
              {isPending ? <Loader2 size={15} className="spin" /> : <Power size={15} />}
              End Day (Offline)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
