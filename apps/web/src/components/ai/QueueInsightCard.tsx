"use client";

import { useState, useEffect } from "react";
import { askQueueAssistant, type AIResponse } from "@/lib/api/ai";
import { Clock3, Sparkles, Loader2 } from "lucide-react";

export function QueueInsightCard({ clinicId }: { clinicId?: string }) {
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function fetchInsight() {
    setIsLoading(true);
    try {
      const res = await askQueueAssistant("Give me a brief summary of the current queue status and estimated wait time.");
      if (res.ok && res.data) {
        setInsight(typeof res.data.response === "string" ? res.data.response : JSON.stringify(res.data.response));
      }
    } catch {
      // Silently fail — this is a supplementary card
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="dashboard-panel" style={{ padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Sparkles size={16} color="var(--color-blue-600)" />
          <strong style={{ fontSize: "0.875rem" }}>AI Queue Insight</strong>
        </div>
        <button
          onClick={fetchInsight}
          disabled={isLoading}
          style={{
            background: "none", border: "1px solid var(--color-slate-200)", borderRadius: "6px",
            padding: "0.25rem 0.5rem", fontSize: "0.75rem", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-slate-600)",
          }}
        >
          {isLoading ? <Loader2 size={12} className="spin" /> : <Clock3 size={12} />}
          {isLoading ? "Loading..." : "Get Insight"}
        </button>
      </div>

      {insight ? (
        <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.5, color: "var(--color-slate-700)", whiteSpace: "pre-wrap" }}>
          {insight}
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-slate-400)" }}>
          Click "Get Insight" to get an AI-powered summary of the current queue.
        </p>
      )}
    </div>
  );
}
