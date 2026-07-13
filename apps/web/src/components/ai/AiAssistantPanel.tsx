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
          position: "fixed", bottom: "32px", right: "32px", zIndex: 1000,
          width: "56px", height: "56px", borderRadius: "50%",
          background: "var(--brand)", color: "white", border: "none",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(23,107,95,0.25)", transition: "transform 0.2s",
        }}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "32px", right: "32px", zIndex: 1000,
      width: "380px", maxHeight: "520px", borderRadius: "16px",
      background: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
      display: "flex", flexDirection: "column", overflow: "hidden",
      border: "1px solid var(--line)",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--brand)", color: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Bot size={20} />
          <strong style={{ fontFamily: "var(--serif)", fontSize: "18px", fontWeight: 500 }}>AI Booking Assistant</strong>
        </div>
        <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", padding: "4px" }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "300px", background: "var(--canvas)" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 16px", fontSize: "14px" }}>
            <div style={{ background: "white", width: "56px", height: "56px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", color: "var(--brand)" }}>
              <Bot size={28} />
            </div>
            <p style={{ lineHeight: 1.5 }}>Hi! I can help you find doctors, check availability, and guide you through booking.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
            background: msg.role === "user" ? "var(--brand)" : "white",
            color: msg.role === "user" ? "white" : "var(--ink)",
            border: msg.role === "user" ? "none" : "1px solid var(--line)",
            padding: "12px 16px", borderRadius: "14px", maxWidth: "85%",
            fontSize: "14px", lineHeight: 1.5, whiteSpace: "pre-wrap",
            borderBottomRightRadius: msg.role === "user" ? "4px" : "14px",
            borderBottomLeftRadius: msg.role !== "user" ? "4px" : "14px",
          }}>
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--muted)", fontSize: "13px", padding: "8px" }}>
            <Loader2 size={14} className="spin" /> Thinking...
          </div>
        )}
        {error && (
          <div style={{ padding: "12px", background: "#fff5f5", color: "#dc2626", borderRadius: "8px", fontSize: "13px", border: "1px solid #fed7d7" }}>
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: "flex", borderTop: "1px solid var(--line)", padding: "12px", background: "white" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about doctors or slots..."
          disabled={isLoading}
          style={{
            flex: 1, border: "1px solid var(--line)", borderRadius: "999px",
            padding: "10px 16px", fontSize: "14px", outline: "none",
            background: "var(--canvas)",
            color: "var(--ink)",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            marginLeft: "8px", background: "var(--brand)", color: "white",
            border: "none", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: (!input.trim() || isLoading) ? 0.5 : 1
          }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
