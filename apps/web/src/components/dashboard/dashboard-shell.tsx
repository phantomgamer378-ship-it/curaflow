"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
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
  UsersRound,
  Building2,
  ShieldCheck
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { TelegramHeader } from "@/components/ui/telegram-header";
import Cookies from "js-cookie";
import { apiFetch } from "@/lib/api";

// Thin wrapper so the toggle inherits dashboard-topbar sizing.
function ThemeToggleInline() {
  return <ThemeToggle className="icon-button" />;
}

type DashboardRole = "patient" | "doctor" | "admin";

const roleNavigation = {
  patient: [
    ["Overview", "dashboard", LayoutDashboard],
    ["Appointments", "appointments", CalendarDays],
    ["Live queue", "live-queue", Clock3],
    ["Notifications", "notifications", Bell],
    ["Profile", "profile", UsersRound],
    ["Settings", "settings", Settings]
  ],
  doctor: [
    ["Overview", "dashboard", LayoutDashboard],
    ["My queue", "queue", Clock3],
    ["Appointments", "appointments", CalendarDays],
    ["Patients", "patients", UsersRound],
    ["Schedule", "schedule", ClipboardList],
    ["Notifications", "notifications", Bell],
    ["Settings", "settings", Settings]
  ],
  admin: [
    ["Dashboard", "dashboard", LayoutDashboard],
    ["Doctors", "doctors", Stethoscope],
    ["Patients", "patients", UsersRound],
    ["Appointments", "appointments", CalendarDays],
    ["Schedules", "schedules", ClipboardList],
    ["Clinics", "clinics", Building2],
    ["Queue Monitor", "queue-monitor", Clock3],
    ["Notifications", "notifications", Bell],
    ["Analytics", "analytics", BarChart3],
    ["Audit Logs", "audit-logs", ClipboardList],
    ["Settings", "settings", Settings],
    ["Roles & Permissions", "roles-permissions", ShieldCheck]
  ]
} as const;

const roleCopy = {
  patient: ["Patient portal", "Vishal Chauhan", "VC"],
  doctor: ["Doctor workspace", "Dr. Anika Mehra", "AM"],
  admin: ["Clinic administration", "Northside Admin", "NA"]
} as const;

import { useState, useEffect } from "react";

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export function DashboardShell({
  role,
  children
}: {
  role: DashboardRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [workspace, fallbackName, fallbackInitials] = roleCopy[role];
  const [userName, setUserName] = useState(fallbackName);
  const [userInitials, setUserInitials] = useState(fallbackInitials);

  useEffect(() => {
    const token = Cookies.get("authToken");
    if (token) {
      const decoded = decodeJwt(token);
      if (decoded && decoded.name) {
        setUserName(decoded.name);
        const parts = decoded.name.split(" ");
        const initials = parts.length > 1 
          ? parts[0][0] + parts[parts.length - 1][0] 
          : parts[0][0];
        setUserInitials(initials.toUpperCase());
      }
    }
  }, []);

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
          {roleNavigation[role].map(([label, slug, Icon], index) => {
            const href = `/${role}/${slug}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link className={isActive ? "active" : ""} href={href} key={label}>
                <Icon size={18} strokeWidth={1.8} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-profile">
          <span>{userInitials}</span>
          <div><strong>{userName}</strong><small>{role}</small></div>
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
              {roleNavigation[role].map(([label, slug]) => {
                const href = `/${role}/${slug}`;
                return (
                  <Link href={href} key={label}>{label}</Link>
                );
              })}
            </nav>
          </details>
          <span className="dashboard-context">{workspace}</span>
          <button className="icon-button" aria-label="Notifications"><Bell size={18} /></button>
          <ThemeToggleInline />
          <TelegramHeader 
            avatar=""
            name={userInitials}
            phone="+1 234 567 8900"
            username="@user"
            actionButton={{
              text: "Profile",
              onClick: () => window.location.href = `/${role}/settings`,
              backgroundColor: "var(--brand)"
            }}
          />
        </header>
        {children}
      </div>
    </div>
  );
}
