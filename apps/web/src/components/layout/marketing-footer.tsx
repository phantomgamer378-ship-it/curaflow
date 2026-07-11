import Link from "next/link";
import { Brand } from "./brand";

export function MarketingFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand inverse />
          <p>Care, right on time. Appointments and live queues made beautifully simple.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <Link href="/features">Features</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/about">About us</Link>
        </div>
        <div>
          <strong>Support</strong>
          <Link href="/faq">FAQs</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/live-queue/demo">Live queue</Link>
        </div>
        <div>
          <strong>Legal</strong>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 CuraFlow Health Technologies</span>
        <span>Designed for calmer clinic days</span>
      </div>
    </footer>
  );
}
