"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import VariableProximity from "./VariableProximity";
import TextType from "./TextType";
import { MagnetizeButton } from "@/components/ui/magnetize-button";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  Check,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  Zap,
  Star,
  Activity
} from "lucide-react";
import { QueuePreview } from "./queue-preview";

const steps = [
  {
    number: "01",
    icon: CalendarCheck2,
    title: "Book in 60 seconds",
    body: "Find the right doctor, pick a slot, and confirm — no phone calls, no paper forms.",
    color: "var(--brand)"
  },
  {
    number: "02",
    icon: BellRing,
    title: "Join the queue instantly",
    body: "Your spot is reserved automatically. Watch your position in real-time from anywhere.",
    color: "#3a748e"
  },
  {
    number: "03",
    icon: Stethoscope,
    title: "Get called in",
    body: "Arrive right when your doctor is ready. No crowded waiting rooms. Just calm, timely care.",
    color: "#946c2d"
  }
] as const;

const clinicLogos = [
  { icon: "✣", name: "Northside Health" },
  { icon: "◎", name: "Meadow Clinic" },
  { icon: "✦", name: "WellSpring" },
  { icon: "⌁", name: "Cedar Medical" },
  { icon: "⊕", name: "Lotus Care" },
];

const trustBadges = [
  { icon: ShieldCheck, label: "100% paperless" },
  { icon: Activity, label: "Real-time queue" },
  { icon: Check, label: "Free for patients" },
];

export function HomePage() {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const router = useRouter();

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-grain" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span><HeartPulse size={14} /></span>
              Live · Clinic Queue
            </div>
            <h1 ref={containerRef} style={{ position: 'relative' }}>
              <VariableProximity
                label="Care,"
                fromFontVariationSettings="'wght' 400, 'opsz' 9"
                toFontVariationSettings="'wght' 1000, 'opsz' 40"
                containerRef={containerRef}
                radius={100}
                falloff="linear"
              />
              <br />
              <em style={{ fontStyle: "normal" }}>
                <VariableProximity
                  label="right on time."
                  fromFontVariationSettings="'wght' 400, 'opsz' 9"
                  toFontVariationSettings="'wght' 1000, 'opsz' 40"
                  containerRef={containerRef}
                  radius={100}
                  falloff="linear"
                />
              </em>
            </h1>
            <p className="hero-lede">
              Skip the waiting room chaos. Book smarter, queue calmer, get seen faster — all from one place.
            </p>
            <div className="hero-actions">
              <MagnetizeButton 
                onClick={() => router.push('/register')} 
                className="button button-large border-none"
              />
              <Link className="button button-outline button-large" href="/how-it-works">
                See how it works <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="trust-row">
              {trustBadges.map(({ icon: Icon, label }) => (
                <span key={label}>
                  <Icon size={16} />
                  {label}
                </span>
              ))}
            </div>
          </div>
          <QueuePreview />
        </div>
      </section>

      {/* ── PROOF STRIP ─────────────────────────────────────── */}
      <section className="proof-strip">
        <div className="container proof-inner">
          <span>Trusted by clinics across the region</span>
          <div className="clinic-logos">
            {clinicLogos.map(({ icon, name }) => (
              <strong key={name}>
                <span>{icon}</span>
                {name}
              </strong>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="section how-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow eyebrow-plain">A smoother care journey</span>
            <h2>
              <TextType
                text={["From booking to consultation,\nwe keep things simple."]}
                typingSpeed={40}
                pauseDuration={2000}
                showCursor={true}
                cursorCharacter="|"
                loop={false}
                startOnVisible={true}
              />
            </h2>
            <p>
              No confusing steps. No crowded waiting rooms. Just a calmer way to see your doctor.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map(({ number, icon: Icon, title, body }) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <span className="step-icon" style={{ background: "var(--mint)", color: "var(--brand)" }}>
                  <Icon size={25} strokeWidth={1.7} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE HIGHLIGHTS ───────────────────────────────── */}
      <section className="section" style={{ background: "var(--white)" }}>
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow eyebrow-plain">Why CuraFlow</span>
            <h2>
              Everything you need.<br />Nothing you don't.
            </h2>
          </div>
          <div className="feature-grid">
            {[
              { icon: Zap, title: "Instant queue updates", body: "Patients see live token numbers on their phone. No refreshing, no guessing." },
              { icon: CalendarCheck2, title: "Smart appointment booking", body: "Slots, doctor availability, and confirmations — handled automatically." },
              { icon: UsersRound, title: "Built for care teams", body: "Doctors and admins get a shared, real-time view of every queue." },
              { icon: Star, title: "Zero friction onboarding", body: "Patients are up and running in under 2 minutes. No app required." },
            ].map(({ icon: Icon, title, body }) => (
              <div className="feature-card" key={title}>
                <span className="feature-icon">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR CLINICS ──────────────────────────────────────── */}
      <section className="section clinic-section">
        <div className="container clinic-callout">
          <div className="clinic-copy">
            <span className="eyebrow eyebrow-light">For modern care teams</span>
            <h2>A calmer clinic is a<br />better clinic.</h2>
            <p>
              CuraFlow gives your team one clear view of the day — appointments, live queues, and patient flow, all together.
            </p>
            <ul>
              <li><Check size={16} /> Fewer front-desk interruptions</li>
              <li><Check size={16} /> A live, shared view of every queue</li>
              <li><Check size={16} /> Clearer days for every care team</li>
            </ul>
            <Link className="button button-light" href="/contact">
              See CuraFlow for clinics <ArrowRight size={17} />
            </Link>
          </div>
          <div className="clinic-dashboard" aria-label="Clinic dashboard preview">
            <div className="mini-sidebar">
              <span className="mini-logo">+</span>
              <i className="active" /><i /><i /><i /><i />
            </div>
            <div className="mini-content">
              <div className="mini-header">
                <div><small>MONDAY, 6 JULY</small><strong>Good morning, Northside</strong></div>
                <span>NS</span>
              </div>
              <div className="mini-stats">
                <div><span><UsersRound size={16} />Today</span><strong>24</strong><small>4 checked in</small></div>
                <div><span><Clock3 size={16} />Avg. wait</span><strong>11m</strong><small className="positive">↓ 8% this week</small></div>
                <div><span><Stethoscope size={16} />Doctors</span><strong>3</strong><small>All on schedule</small></div>
              </div>
              <div className="mini-queue">
                <div><strong>Live queue</strong><span>Updated now</span></div>
                {[
                  ["A-18", "In consultation", "Dr. Mehra", "now"],
                  ["A-19", "Waiting", "Dr. Mehra", "8 min"],
                  ["B-08", "Waiting", "Dr. Shah", "14 min"]
                ].map((row, index) => (
                  <div className="mini-row" key={row[0]}>
                    <b>{row[0]}</b>
                    <span className={index === 0 ? "live" : ""}>{row[1]}</span>
                    <span>{row[2]}</span>
                    <small>{row[3]}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL / SOCIAL PROOF ───────────────────────── */}
      <section className="section" style={{ background: "var(--canvas)" }}>
        <div className="container">
          <div className="testimonials-grid">
            {[
              {
                quote: "We reduced our waiting room crowd by 60% in the first week. Patients love it.",
                name: "Dr. Anita R.",
                role: "General Physician · Northside Health"
              },
              {
                quote: "I checked in from the parking lot. By the time I got inside, my name was almost up.",
                name: "Rahul M.",
                role: "Patient · Meadow Clinic"
              },
              {
                quote: "The admin dashboard gives us a bird's-eye view of the whole day. It's like radar.",
                name: "Priya S.",
                role: "Clinic Manager · WellSpring"
              },
            ].map(({ quote, name, role }) => (
              <div className="testimonial-card" key={name}>
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} fill="var(--brand)" color="var(--brand)" />
                  ))}
                </div>
                <p className="testimonial-quote">"{quote}"</p>
                <div className="testimonial-author">
                  <strong>{name}</strong>
                  <span>{role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="section final-cta">
        <div className="container final-cta-inner">
          <div>
            <span className="eyebrow eyebrow-plain">Your time matters</span>
            <h2>Ready to simplify<br />your clinic?</h2>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
            <Link className="button button-primary button-large" href="/register">
              Book your appointment <ArrowRight size={18} />
            </Link>
            <Link className="button button-ghost button-large" href="/contact">
              Talk to us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
