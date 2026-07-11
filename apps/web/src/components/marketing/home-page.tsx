import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  Check,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  UsersRound
} from "lucide-react";
import { QueuePreview } from "./queue-preview";

const steps = [
  {
    number: "01",
    icon: CalendarCheck2,
    title: "Choose your care",
    body: "Find the right doctor and pick a time that works for your day."
  },
  {
    number: "02",
    icon: BellRing,
    title: "Stay in the loop",
    body: "Get thoughtful reminders and see your live place in the queue."
  },
  {
    number: "03",
    icon: Stethoscope,
    title: "Arrive right on time",
    body: "Spend less time waiting and more time getting the care you need."
  }
] as const;

export function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-grain" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><span><HeartPulse size={14} /></span> Better care starts before the visit</div>
            <h1>Less waiting.<br /><em>More caring.</em></h1>
            <p className="hero-lede">
              Book your appointment in moments, follow the live queue, and arrive exactly when your doctor is ready.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary button-large" href="/register">
                Find an appointment <ArrowRight size={18} />
              </Link>
              <Link className="text-link" href="/live-queue/demo">
                Check a live queue <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <div className="trust-row">
              <span><ShieldCheck size={18} /> Private & secure</span>
              <span><Clock3 size={18} /> Real-time updates</span>
              <span><Check size={18} /> Free for patients</span>
            </div>
          </div>
          <QueuePreview />
        </div>
      </section>

      <section className="proof-strip">
        <div className="container proof-inner">
          <span>Built for healthier days at</span>
          <div className="clinic-logos">
            <strong><span>✣</span> Northside Health</strong>
            <strong><span>◎</span> Meadow Clinic</strong>
            <strong><span>✦</span> WellSpring</strong>
            <strong><span>⌁</span> Cedar Medical</strong>
          </div>
        </div>
      </section>

      <section className="section how-section">
        <div className="container">
          <div className="section-heading centered">
            <span className="eyebrow eyebrow-plain">A smoother care journey</span>
            <h2>From booking to consultation,<br />we keep things simple.</h2>
            <p>No confusing steps. No crowded waiting rooms. Just a calmer way to see your doctor.</p>
          </div>
          <div className="steps-grid">
            {steps.map(({ number, icon: Icon, title, body }) => (
              <article className="step-card" key={number}>
                <span className="step-number">{number}</span>
                <span className="step-icon"><Icon size={25} strokeWidth={1.7} /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section clinic-section">
        <div className="container clinic-callout">
          <div className="clinic-copy">
            <span className="eyebrow eyebrow-light">For modern care teams</span>
            <h2>A calmer clinic is a<br />better clinic.</h2>
            <p>CuraFlow gives your team one clear view of the day—appointments, live queues, and patient flow, all together.</p>
            <ul>
              <li><Check size={16} /> Fewer front-desk interruptions</li>
              <li><Check size={16} /> A live, shared view of every queue</li>
              <li><Check size={16} /> Clearer days for every care team</li>
            </ul>
            <Link className="button button-light" href="/contact">See CuraFlow for clinics <ArrowRight size={17} /></Link>
          </div>
          <div className="clinic-dashboard" aria-label="Clinic dashboard preview">
            <div className="mini-sidebar">
              <span className="mini-logo">+</span>
              <i className="active" /><i /><i /><i /><i />
            </div>
            <div className="mini-content">
              <div className="mini-header"><div><small>MONDAY, 6 JULY</small><strong>Good morning, Northside</strong></div><span>NS</span></div>
              <div className="mini-stats">
                <div><span><UsersRound size={16} /> Today</span><strong>24</strong><small>4 checked in</small></div>
                <div><span><Clock3 size={16} /> Avg. wait</span><strong>11m</strong><small className="positive">↓ 8% this week</small></div>
                <div><span><Stethoscope size={16} /> Doctors</span><strong>3</strong><small>All on schedule</small></div>
              </div>
              <div className="mini-queue">
                <div><strong>Live queue</strong><span>Updated now</span></div>
                {[
                  ["A-18", "In consultation", "Dr. Mehra", "now"],
                  ["A-19", "Waiting", "Dr. Mehra", "8 min"],
                  ["B-08", "Waiting", "Dr. Shah", "14 min"]
                ].map((row, index) => (
                  <div className="mini-row" key={row[0]}>
                    <b>{row[0]}</b><span className={index === 0 ? "live" : ""}>{row[1]}</span><span>{row[2]}</span><small>{row[3]}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section final-cta">
        <div className="container final-cta-inner">
          <div><span className="eyebrow eyebrow-plain">Your time matters</span><h2>Ready for a better clinic visit?</h2></div>
          <Link className="button button-primary button-large" href="/register">Book your appointment <ArrowRight size={18} /></Link>
        </div>
      </section>
    </main>
  );
}
