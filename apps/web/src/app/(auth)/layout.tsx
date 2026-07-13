"use client";

import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      {/* ── Branded left panel ────────────────────────────── */}
      <section className="auth-aside">
        <div className="auth-aside-top">
          <Brand inverse />
        </div>
        <div className="auth-aside-body">
          <span className="eyebrow eyebrow-light" style={{ marginBottom: "20px", display: "block" }}>
            Care without the clutter
          </span>
          <h1>
            Your clinic visit,<br />beautifully timed.
          </h1>
          <p>
            Book in moments, follow the live queue, and spend your day where it matters — with the people you love.
          </p>
          <div className="auth-aside-stats">
            {[
              { value: "2 min", label: "to book an appointment" },
              { value: "Live", label: "real-time queue updates" },
              { value: "Free", label: "for all patients" },
            ].map(({ value, label }) => (
              <div key={label} className="auth-stat">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
        <span className="auth-trust">
          <ShieldCheck size={18} />
          Private, secure, and built for care
        </span>
      </section>

      {/* ── Form right panel ──────────────────────────────── */}
      <section className="auth-content">
        <div className="auth-top">
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={14} /> Back home
          </Link>
          <ThemeToggle />
        </div>
        {children}
      </section>
    </main>
  );
}
