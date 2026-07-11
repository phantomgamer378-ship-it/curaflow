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
    <div className="dashboard-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Sparkles size={20} color="var(--color-blue-600)" />
        <strong>AI Operations Assistant</strong>
      </div>

      <div style={{ minHeight: "200px", maxHeight: "350px", overflowY: "auto", marginBottom: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--color-slate-400)", padding: "2rem", fontSize: "0.875rem" }}>
            <BarChart3 size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
            <p>Ask me about no-show rates, booking trends, doctor utilization, or schedule optimization.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            padding: "0.75rem", borderRadius: "8px", fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-wrap",
            background: msg.role === "user" ? "var(--color-blue-50)" : "var(--color-slate-50)",
            border: `1px solid ${msg.role === "user" ? "var(--color-blue-200)" : "var(--color-slate-200)"}`,
          }}>
            <small style={{ fontWeight: 600, color: "var(--color-slate-500)", display: "block", marginBottom: "0.25rem" }}>
              {msg.role === "user" ? "You" : "AI"}
            </small>
            {msg.content}
          </div>
        ))}
        {isLoading && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-slate-400)", fontSize: "0.875rem" }}><Loader2 size={16} className="spin" /> Analyzing...</div>}
        {error && <div style={{ padding: "0.5rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.75rem" }}>{error}</div>}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., What's our no-show rate this month?"
          disabled={isLoading}
          style={{ flex: 1, padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", fontSize: "0.875rem" }}
        />
        <button type="submit" disabled={isLoading || !input.trim()} className="button button-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Send size={14} /> Ask
        </button>
      </form>
    </div>
  );
}
