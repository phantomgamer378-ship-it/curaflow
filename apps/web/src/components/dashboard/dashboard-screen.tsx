import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Plus,
  Stethoscope,
  UsersRound
} from "lucide-react";

type DashboardRole = "patient" | "doctor" | "admin";

const titleBySlug: Record<string, string> = {
  appointments: "Appointments",
  "appointments/new": "Book an appointment",
  "appointments/demo": "Appointment details",
  "appointments/demo/reschedule": "Reschedule appointment",
  "live-queue": "Live queue",
  profile: "Your profile",
  notifications: "Notifications",
  settings: "Settings",
  queue: "Today’s queue",
  patients: "Patients",
  "patients/demo": "Patient details",
  schedule: "Schedule",
  doctors: "Doctors",
  "doctors/new": "Add a doctor",
  "doctors/demo": "Doctor details",
  schedules: "Schedules",
  clinics: "Clinics",
  "queue-monitor": "Queue monitor",
  analytics: "Analytics",
  "audit-logs": "Audit logs",
  "roles-permissions": "Roles & permissions"
};

const roleHome = {
  patient: {
    greeting: "Good morning, Vishal",
    body: "Here’s everything you need for a smooth clinic visit.",
    action: "Book appointment"
  },
  doctor: {
    greeting: "Good morning, Dr. Mehra",
    body: "Your first patient is checked in. The day is on schedule.",
    action: "Open my queue"
  },
  admin: {
    greeting: "Good morning, Northside",
    body: "All three doctors are active and today’s queues are moving well.",
    action: "View queue monitor"
  }
} as const;

export function DashboardScreen({
  role,
  segments = []
}: {
  role: DashboardRole;
  segments?: string[];
}) {
  const slug = segments.join("/");
  const home = roleHome[role];
  const title = titleBySlug[slug] ?? (slug ? slug.split("/").at(-1)?.replaceAll("-", " ") : home.greeting);

  if (slug) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-heading">
          <div><span className="overline">{role} workspace</span><h1>{title}</h1><p>This module is scaffolded and ready for its implementation phase.</p></div>
          <button className="button button-primary"><Plus size={17} /> New</button>
        </div>
        <section className="module-placeholder">
          <div className="placeholder-icon"><CalendarDays size={28} /></div>
          <h2>{title}</h2>
          <p>The presentation boundary is in place. Data, validation, permissions, and use-case handlers are added in the corresponding build phase.</p>
          <Link href={`/${role}`} className="text-link">Return to overview <ArrowRight size={16} /></Link>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <div className="dashboard-heading">
        <div><span className="overline">MONDAY, 6 JULY</span><h1>{home.greeting}</h1><p>{home.body}</p></div>
        <button className="button button-primary"><Plus size={17} /> {home.action}</button>
      </div>
      <div className="dashboard-stats">
        <article><span className="stat-icon green"><CalendarDays size={20} /></span><div><small>Today’s appointments</small><strong>{role === "admin" ? "24" : role === "doctor" ? "8" : "1"}</strong><span><b>On schedule</b> for today</span></div></article>
        <article><span className="stat-icon sand"><Clock3 size={20} /></span><div><small>Average wait</small><strong>11 min</strong><span><b>8% faster</b> this week</span></div></article>
        <article><span className="stat-icon blue"><UsersRound size={20} /></span><div><small>{role === "patient" ? "People ahead" : "Checked in"}</small><strong>{role === "patient" ? "3" : "4"}</strong><span>Live queue is active</span></div></article>
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><div><span className="live-dot" /> Live now</div><Link href={`/${role}/${role === "doctor" ? "queue" : "live-queue"}`}>View all <ChevronRight size={16} /></Link></div>
          <div className="now-serving">
            <small>NOW SERVING</small><strong>A-18</strong><span>Dr. Anika Mehra · Room 3</span>
          </div>
          <div className="your-turn">
            <span className="token-box">A-21</span>
            <div><small>{role === "patient" ? "YOUR TOKEN" : "UP NEXT"}</small><strong>About 12 minutes</strong><span><Check size={13} /> Queue updated moments ago</span></div>
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading"><strong>Upcoming</strong><Link href={`/${role}/appointments`}>All appointments <ChevronRight size={16} /></Link></div>
          {[
            ["10:30", "Dr. Anika Mehra", "General medicine"],
            ["11:15", "Dr. Rohan Shah", "Dermatology"],
            ["12:00", "Dr. Leena Rao", "Paediatrics"]
          ].map(([time, doctor, specialty], index) => (
            <div className="appointment-list-row" key={time}>
              <span className={index === 0 ? "active" : ""}>{time}<small>AM</small></span>
              <div><strong>{doctor}</strong><small>{specialty}</small></div>
              <ChevronRight size={17} />
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
