"use client";

import Link from "next/link";
import { Brand } from "./brand";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["How it works", "/how-it-works"],
  ["Features", "/features"],
  ["For clinics", "/about"],
  ["FAQs", "/faq"]
] as const;

export function MarketingHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <Link className="login-link" href="/login">Log in</Link>
          <Link className="button button-primary header-cta" href="/register">Book an appointment</Link>
        </div>
        <details className="mobile-menu">
          <summary aria-label="Open navigation"><span /><span /><span /></summary>
          <nav>
            {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
            <Link href="/login">Log in</Link>
            <Link href="/register">Book an appointment</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
