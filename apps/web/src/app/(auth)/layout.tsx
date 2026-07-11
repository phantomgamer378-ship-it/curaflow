import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { ShieldCheck } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-aside">
        <Brand inverse />
        <div>
          <span className="eyebrow eyebrow-light">Care without the clutter</span>
          <h1>Your clinic visit,<br />beautifully timed.</h1>
          <p>Book in moments, follow the queue, and spend your day where it matters.</p>
        </div>
        <span className="auth-trust"><ShieldCheck size={18} /> Private, secure, and built for care</span>
      </section>
      <section className="auth-content">
        <div className="auth-top"><Link href="/">← Back home</Link></div>
        {children}
      </section>
    </main>
  );
}
