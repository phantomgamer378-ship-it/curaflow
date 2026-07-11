export default function AdminQueueMonitorPage() {
  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div>
          <h1>Global Queue Monitor</h1>
          <p>Real-time oversight of all clinic queues.</p>
        </div>
      </div>
      <div className="dashboard-panel" style={{ marginTop: "2rem", padding: "4rem", textAlign: "center" }}>
        <p style={{ color: "var(--color-slate-500)" }}>The global queue monitor is currently disabled in this environment.</p>
      </div>
    </main>
  );
}
