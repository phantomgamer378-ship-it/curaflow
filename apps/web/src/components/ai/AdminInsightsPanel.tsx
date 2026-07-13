"use client";

import { useState } from "react";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { askAdminInsights } from "@/lib/api/ai";
import { BarChart3, Send, Loader2, Sparkles } from "lucide-react";

export function AdminInsightsPanel() {
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage } = useAiAssistant({
    apiFn: askAdminInsights,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  }

  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <div style={{ background: "var(--canvas)", padding: "8px", borderRadius: "8px", color: "var(--brand)" }}>
          <Sparkles size={18} />
        </div>
        <strong style={{ fontFamily: "var(--serif)", fontSize: "18px", fontWeight: 500 }}>AI Operations Assistant</strong>
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "var(--canvas)", padding: "16px", borderRadius: "12px", border: "1px solid var(--line)" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "32px 16px", fontSize: "14px" }}>
            <div style={{ background: "white", width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", color: "var(--brand)" }}>
              <BarChart3 size={24} />
            </div>
            <p style={{ lineHeight: 1.5 }}>Ask me about no-show rates, booking trends, doctor utilization, or schedule optimization.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: "12px", borderRadius: "12px", fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap",
            background: msg.role === "user" ? "white" : "var(--brand)",
            color: msg.role === "user" ? "var(--ink)" : "white",
            border: msg.role === "user" ? "1px solid var(--line)" : "none",
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "90%",
            borderBottomRightRadius: msg.role === "user" ? "4px" : "12px",
            borderBottomLeftRadius: msg.role !== "user" ? "4px" : "12px",
          }}>
            <small style={{ fontWeight: 600, color: msg.role === "user" ? "var(--muted)" : "rgba(255,255,255,0.7)", display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {msg.role === "user" ? "You" : "Insights AI"}
            </small>
            {msg.content}
          </div>
        ))}
        {isLoading && <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "13px", padding: "8px" }}><Loader2 size={14} className="spin" /> Analyzing data...</div>}
        {error && <div style={{ padding: "12px", background: "#fff5f5", color: "#dc2626", borderRadius: "8px", fontSize: "13px", border: "1px solid #fed7d7" }}>{error}</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "8px" }}>
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., What's our no-show rate this month?"
          disabled={isLoading}
          style={{ flex: 1, padding: "12px 16px", borderRadius: "999px", border: "1px solid var(--line)", fontSize: "14px", outline: "none", background: "var(--canvas)" }}
        />
        <button type="submit" disabled={isLoading || !input.trim()} style={{ 
          background: "var(--brand)", color: "white", border: "none", borderRadius: "999px", padding: "0 20px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontWeight: 500,
          opacity: (!input.trim() || isLoading) ? 0.5 : 1
        }}>
          <Send size={14} /> Ask
        </button>
      </form>
    </div>
  );
}
