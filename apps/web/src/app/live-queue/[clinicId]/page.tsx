import { apiFetch } from "@/lib/api";
import { LiveQueueDisplay } from "@/components/queue/live-queue-display";
import { Brand } from "@/components/layout/brand";
import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function LiveQueuePage({ params }: { params: Promise<{ clinicId: string }> }) {
  const { clinicId } = await params;
  const id = clinicId === "demo" ? "00000000-0000-0000-0000-000000000000" : clinicId;

  let initialSnapshot = { doctors: [] };
  try {
    const res = await apiFetch(`/api/queue/${id}/current`);
    if (res.ok && res.data) {
      initialSnapshot = res.data;
    }
  } catch (e) {
    console.error("Failed to load initial queue snapshot:", e);
  }

  return (
    <div className="public-queue">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="public-queue-header">
        <Brand />
        <span className="public-queue-clinic-name">City Health Clinic</span>
        <span className="queue-secure">
          <span className="live-dot" style={{ marginRight: "4px" }} />
          Secured · Live
          <ThemeToggle />
        </span>
      </header>

      {/* ── Main queue display ──────────────────────────────── */}
      <main>
        <LiveQueueDisplay clinicId={id} initialSnapshot={initialSnapshot} />
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer style={{
        textAlign: "center",
        padding: "24px",
        color: "var(--muted)",
        fontSize: "11px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px"
      }}>
        <ShieldCheck size={14} />
        Auto-refreshes every 30 seconds · Powered by CuraFlow
      </footer>
    </div>
  );
}
