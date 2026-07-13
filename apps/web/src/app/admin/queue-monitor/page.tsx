import { QueueInsightCard } from "@/components/ai/QueueInsightCard";

export default function AdminQueueMonitorPage() {
  return (
    <main style={{ padding: "45px 42px" }}>
      <header style={{ marginBottom: "38px" }}>
        <span style={{ fontSize: "11px", color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800, marginBottom: "8px", display: "block" }}>
          Admin Workspace
        </span>
        <h1 style={{ fontFamily: "var(--serif)", fontSize: "38px", fontWeight: 400, letterSpacing: "-.04em", margin: "0 0 8px" }}>
          Global Queue Monitor
        </h1>
        <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
          Real-time oversight of all clinic queues and AI-powered wait time insights.
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "16px", border: "1px solid var(--line)", textAlign: "center" }}>
          <p style={{ color: "var(--muted)" }}>The live socket connections for global monitor are currently disabled in this environment.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <QueueInsightCard />
        </div>
      </div>
    </main>
  );
}
