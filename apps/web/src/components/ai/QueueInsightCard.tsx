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
    <div style={{ background: "white", padding: "20px", borderRadius: "16px", border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ background: "var(--canvas)", padding: "6px", borderRadius: "6px", color: "var(--brand)" }}>
            <Sparkles size={14} />
          </div>
          <strong style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>AI Queue Insight</strong>
        </div>
        <button
          onClick={fetchInsight}
          disabled={isLoading}
          style={{
            background: "none", border: "1px solid var(--line)", borderRadius: "999px",
            padding: "4px 12px", fontSize: "12px", cursor: "pointer", fontWeight: 600,
            display: "flex", alignItems: "center", gap: "6px", color: "var(--ink)",
            opacity: isLoading ? 0.6 : 1, transition: "background 0.2s"
          }}
        >
          {isLoading ? <Loader2 size={12} className="spin" /> : <Clock3 size={12} />}
          {isLoading ? "Analyzing..." : "Get Insight"}
        </button>
      </div>

      {insight ? (
        <div style={{ background: "var(--canvas)", padding: "16px", borderRadius: "12px" }}>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.6, color: "var(--ink)", whiteSpace: "pre-wrap" }}>
            {insight}
          </p>
        </div>
      ) : (
        <div style={{ background: "var(--canvas)", padding: "20px", borderRadius: "12px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
            Click <strong>"Get Insight"</strong> to get an AI-powered summary of the current queue, estimated wait times, and delays.
          </p>
        </div>
      )}
    </div>
  );
}
