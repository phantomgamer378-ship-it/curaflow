"use client";

import { useState } from "react";
import { askDoctorNoteAssistant } from "@/lib/api/ai";
import { FileText, Loader2, Sparkles, Copy, CheckCircle } from "lucide-react";

export function DoctorNoteDraftPanel() {
  const [rawNote, setRawNote] = useState("");
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleDraft() {
    if (!rawNote.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setDraftResult(null);

    try {
      const res = await askDoctorNoteAssistant(rawNote);
      if (res.ok && res.data) {
        setDraftResult(typeof res.data.response === "string" ? res.data.response : JSON.stringify(res.data.response));
        setDisclaimer(res.data.disclaimer || null);
      } else {
        setError(res.error || "Failed to generate draft.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    if (!draftResult) return;
    navigator.clipboard.writeText(draftResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", border: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
        <div style={{ background: "var(--canvas)", padding: "8px", borderRadius: "8px", color: "var(--brand)" }}>
          <Sparkles size={18} />
        </div>
        <strong style={{ fontFamily: "var(--serif)", fontSize: "18px", fontWeight: 500 }}>AI Note Assistant</strong>
      </div>

      <div style={{ position: "relative" }}>
        <textarea
          value={rawNote}
          onChange={(e) => setRawNote(e.target.value)}
          placeholder="Dictate or type rough consultation notes here..."
          rows={5}
          style={{
            width: "100%", padding: "16px", borderRadius: "12px",
            border: "1px solid var(--line)", fontSize: "14px",
            resize: "vertical", fontFamily: "inherit",
            background: "var(--canvas)", color: "var(--ink)",
            outlineColor: "var(--brand)"
          }}
        />
      </div>

      <button
        onClick={handleDraft}
        disabled={isLoading || !rawNote.trim()}
        style={{ 
          marginTop: "16px", display: "flex", alignItems: "center", gap: "8px",
          background: "var(--brand)", color: "white", padding: "12px 24px",
          borderRadius: "999px", border: "none", cursor: "pointer", fontWeight: 500, fontSize: "14px",
          opacity: (isLoading || !rawNote.trim()) ? 0.6 : 1
        }}
      >
        {isLoading ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
        {isLoading ? "Generating Draft..." : "Generate Structured Note"}
      </button>

      {error && (
        <div role="alert" style={{ marginTop: "16px", padding: "12px", background: "#fff5f5", color: "#dc2626", borderRadius: "8px", fontSize: "13px", border: "1px solid #fed7d7" }}>
          {error}
        </div>
      )}

      {draftResult && (
        <div style={{ marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Structured Output</span>
            <button 
              onClick={handleCopy} 
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--brand)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: 600 }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Note"}
            </button>
          </div>
          <div style={{
            padding: "16px", background: "white", borderRadius: "12px",
            border: "1px solid var(--line)", fontSize: "14px",
            whiteSpace: "pre-wrap", lineHeight: 1.6, color: "var(--ink)"
          }}>
            {draftResult}
          </div>
          {disclaimer && (
            <div style={{ marginTop: "12px", display: "flex", gap: "8px", padding: "12px", background: "var(--canvas)", color: "var(--muted)", borderRadius: "8px", fontSize: "12px" }}>
              <Sparkles size={16} style={{ flexShrink: 0 }} />
              <span>{disclaimer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
