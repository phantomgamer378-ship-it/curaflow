"use client";

import { useState } from "react";
import { askDoctorNoteAssistant } from "@/lib/api/ai";
import { FileText, Loader2, Sparkles } from "lucide-react";

export function DoctorNoteDraftPanel() {
  const [rawNote, setRawNote] = useState("");
  const [draftResult, setDraftResult] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="dashboard-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <Sparkles size={20} color="var(--color-blue-600)" />
        <strong>AI Note Assistant</strong>
      </div>

      <textarea
        value={rawNote}
        onChange={(e) => setRawNote(e.target.value)}
        placeholder="Paste or dictate your rough consultation notes here..."
        rows={5}
        style={{
          width: "100%", padding: "0.75rem", borderRadius: "8px",
          border: "1px solid var(--color-slate-300)", fontSize: "0.875rem",
          resize: "vertical", fontFamily: "inherit",
        }}
      />

      <button
        onClick={handleDraft}
        disabled={isLoading || !rawNote.trim()}
        className="button button-primary"
        style={{ marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        {isLoading ? <Loader2 size={16} className="spin" /> : <FileText size={16} />}
        {isLoading ? "Generating..." : "Generate Structured Note"}
      </button>

      {error && (
        <div role="alert" style={{ marginTop: "1rem", padding: "0.75rem", background: "#fee2e2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.875rem" }}>
          {error}
        </div>
      )}

      {draftResult && (
        <div style={{ marginTop: "1rem" }}>
          {disclaimer && (
            <div style={{ padding: "0.5rem 0.75rem", background: "var(--color-amber-100)", color: "var(--color-amber-800)", borderRadius: "8px", fontSize: "0.75rem", marginBottom: "0.75rem" }}>
              {disclaimer}
            </div>
          )}
          <div style={{
            padding: "1rem", background: "var(--color-slate-50)", borderRadius: "8px",
            border: "1px solid var(--color-slate-200)", fontSize: "0.875rem",
            whiteSpace: "pre-wrap", lineHeight: 1.6,
          }}>
            {draftResult}
          </div>
        </div>
      )}
    </div>
  );
}
