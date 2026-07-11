"use client";

import { useState } from "react";
import { useAiAssistant } from "@/hooks/useAiAssistant";
import { askPatientAssistant } from "@/lib/api/ai";
import { Bot, Send, X, Loader2, MessageCircle } from "lucide-react";

export function AiAssistantPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage, clearChat } = useAiAssistant({
    apiFn: askPatientAssistant,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "var(--color-blue-600)", color: "white", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)", transition: "transform 0.2s",
        }}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000,
      width: "380px", maxHeight: "520px", borderRadius: "16px",
      background: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      border: "1px solid var(--color-slate-200)",
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--color-blue-600)", color: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Bot size={20} />
          <strong>AI Booking Assistant</strong>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: "300px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--color-slate-400)", padding: "3rem 1rem", fontSize: "0.875rem" }}>
            <Bot size={32} style={{ margin: "0 auto 0.5rem", opacity: 0.5 }} />
            <p>Hi! I can help you find doctors, check availability, and guide you through booking.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? "var(--color-blue-600)" : "var(--color-slate-100)",
            color: msg.role === "user" ? "white" : "var(--color-slate-900)",
            padding: "0.75rem 1rem", borderRadius: "12px", maxWidth: "85%",
            fontSize: "0.875rem", lineHeight: 1.5, whiteSpace: "pre-wrap",
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-slate-400)", fontSize: "0.875rem" }}>
            <Loader2 size={16} className="spin" /> Thinking...
          </div>
        )}
        {error && (
          <div style={{ padding: "0.5rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.75rem" }}>
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", borderTop: "1px solid var(--color-slate-200)", padding: "0.75rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about doctors, slots, appointments..."
          disabled={isLoading}
          style={{
            flex: 1, border: "1px solid var(--color-slate-200)", borderRadius: "8px",
            padding: "0.5rem 0.75rem", fontSize: "0.875rem", outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            marginLeft: "0.5rem", background: "var(--color-blue-600)", color: "white",
            border: "none", borderRadius: "8px", padding: "0.5rem 0.75rem", cursor: "pointer",
            display: "flex", alignItems: "center",
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
