"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Settings,
  Stethoscope,
  UsersRound
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

type DashboardRole = "patient" | "doctor" | "admin";

const roleNavigation = {
  patient: [
    ["Overview", "", LayoutDashboard],
    ["Appointments", "appointments", CalendarDays],
    ["Live queue", "live-queue", Clock3],
    ["Notifications", "notifications", Bell],
    ["Profile", "profile", UsersRound],
    ["Settings", "settings", Settings]
  ],
  doctor: [
    ["Overview", "", LayoutDashboard],
    ["My queue", "queue", Clock3],
    ["Appointments", "appointments", CalendarDays],
    ["Patients", "patients", UsersRound],
    ["Schedule", "schedule", ClipboardList],
    ["Notifications", "notifications", Bell],
    ["Settings", "settings", Settings]
  ],
  admin: [
    ["Overview", "", LayoutDashboard],
    ["Doctors", "doctors", Stethoscope],
    ["Patients", "patients", UsersRound],
    ["Appointments", "appointments", CalendarDays],
    ["Queue monitor", "queue-monitor", Clock3],
    ["Analytics", "analytics", BarChart3],
    ["Audit logs", "audit-logs", ClipboardList],
    ["Settings", "settings", Settings]
  ]
} as const;

const roleCopy = {
  patient: ["Patient portal", "Vishal Chauhan", "VC"],
  doctor: ["Doctor workspace", "Dr. Anika Mehra", "AM"],
  admin: ["Clinic administration", "Northside Admin", "NA"]
} as const;

export function DashboardShell({
  role,
  children
}: {
  role: DashboardRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [workspace, name, initials] = roleCopy[role];

  const handleLogout = async () => {
    // Attempt backend logout (though JWT is stateless, this can clear any server sessions if needed)
    await apiFetch("/api/auth/logout", { method: "POST" });
    // Clear cookie
    Cookies.remove("authToken");
    // Redirect to login
    router.push("/login");
  };

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Brand />
        <span className="workspace-label">{workspace}</span>
        <nav aria-label={`${role} navigation`}>
          {roleNavigation[role].map(([label, slug, Icon], index) => (
            <Link className={index === 0 ? "active" : ""} href={`/${role}${slug ? `/${slug}` : ""}`} key={label}>
              <Icon size={18} strokeWidth={1.8} /> {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-profile">
          <span>{initials}</span>
          <div><strong>{name}</strong><small>{role}</small></div>
          <button onClick={handleLogout} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }} aria-label="Log out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <details className="dashboard-mobile-nav">
            <summary>Menu</summary>
            <nav>
              {roleNavigation[role].map(([label, slug]) => (
                <Link href={`/${role}${slug ? `/${slug}` : ""}`} key={label}>{label}</Link>
              ))}
            </nav>
          </details>
          <span className="dashboard-context">{workspace}</span>
          <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
          <span className="topbar-avatar">{initials}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
