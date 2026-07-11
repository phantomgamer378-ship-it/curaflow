import { apiFetch } from "@/lib/api";
import { LiveQueueDisplay } from "@/components/queue/live-queue-display";
import { Brand } from "@/components/layout/brand";

export default async function LiveQueuePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  
  // A demo fallback if no clinicId provided (we'll just use the default clinic we created earlier)
  const id = clinicId === "demo" ? "00000000-0000-0000-0000-000000000000" : clinicId;
  
  let initialSnapshot = { current_token: 0, waiting_count: 0 };
  try {
    const res = await apiFetch(`/api/queue/${id}/current`);
    if (res.ok && res.data) {
      initialSnapshot = res.data;
    }
  } catch (e) {
    console.error("Failed to load initial queue snapshot:", e);
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-slate-50)" }}>
      <header style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-slate-200)", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Brand />
        <span className="badge badge-green">LIVE</span>
      </header>
      
      <main>
        <LiveQueueDisplay clinicId={id} initialSnapshot={initialSnapshot} />
      </main>
      
      <footer style={{ padding: "2rem", textAlign: "center", color: "var(--color-slate-400)", fontSize: "0.875rem" }}>
        Powered by CuraFlow Realtime Engine
      </footer>
    </div>
  );
}
