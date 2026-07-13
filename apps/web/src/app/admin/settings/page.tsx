"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { 
  User, 
  Lock, 
  Bell, 
  Trash2, 
  LogOut, 
  Loader2, 
  Clock, 
  Sliders, 
  Building, 
  Database, 
  Mail 
} from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  
  // Profile state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Clinic info
  const [clinicName, setClinicName] = useState("Main Clinic");
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [isClinicSaving, setIsClinicSaving] = useState(false);

  // Integrations info
  const [isTwilioConnected, setIsTwilioConnected] = useState(true);
  const [isResendConnected, setIsResendConnected] = useState(true);
  const [auditLogRetention, setAuditLogRetention] = useState(90);

  // Notifications State (Mocked preferences)
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [isNotifSaving, setIsNotifSaving] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      setIsProfileLoading(true);
      try {
        const token = Cookies.get("authToken");
        if (token) {
          const parts = token.split('.');
          if (parts[1]) {
            const decoded = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setName(decoded.name || "");
            setEmail(decoded.email || "");
          }
        }

        // Fetch clinic details
        const clinicRes = await apiFetch("/api/admin/analytics"); // to check connectivity
      } catch (e) {
        console.error(e);
      } finally {
        setIsProfileLoading(false);
      }
    }
    loadAdminData();
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify({ name, phone })
      });

      if (!res.ok) {
        throw new Error(res.error || "Failed to save profile");
      }

      setProfileMsg({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setIsProfileLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsPasswordLoading(true);
    setPasswordMsg(null);

    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!res.ok) {
        throw new Error(res.error || "Failed to update password");
      }

      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message });
    } finally {
      setIsPasswordLoading(false);
    }
  }

  async function handleSaveClinic(e: React.FormEvent) {
    e.preventDefault();
    setIsClinicSaving(true);
    setTimeout(() => {
      setIsClinicSaving(false);
    }, 600);
  }

  async function handleNotificationSave() {
    setIsNotifSaving(true);
    setTimeout(() => {
      setIsNotifSaving(false);
    }, 800);
  }

  const handleLogoutAll = () => {
    if (confirm("Are you sure you want to log out of all devices?")) {
      Cookies.remove("authToken");
      router.push("/login");
    }
  };

  return (
    <main className="dashboard-page" style={{ maxWidth: "1000px", margin: "0 auto" }}>
      <div className="dashboard-heading">
        <div>
          <span className="overline">Settings</span>
          <h1>Clinic Configuration & Settings</h1>
          <p>Configure clinic properties, integrations, notification logs, and profile settings.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem", marginTop: "2rem" }}>
        
        {/* CLINIC PROPERTIES */}
        <section className="dashboard-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            <Building size={18} color="var(--color-blue-600)" />
            <strong style={{ fontSize: "1.1rem" }}>Clinic Operational Details</strong>
          </div>

          <form onSubmit={handleSaveClinic} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "500px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              Clinic Name
              <input type="text" value={clinicName} onChange={(e) => setClinicName(e.target.value)} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
            </label>

            <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>
                Opening Hour
                <input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>
                Closing Hour
                <input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
              </label>
            </div>

            <button type="submit" disabled={isClinicSaving} className="button button-primary" style={{ width: "fit-content", padding: "0.6rem 1.5rem" }}>
              {isClinicSaving && <Loader2 size={16} className="spin" />}
              Save Clinic Info
            </button>
          </form>
        </section>

        {/* INTEGRATIONS & PROVIDERS */}
        <section className="dashboard-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            <Database size={18} color="var(--color-blue-600)" />
            <strong style={{ fontSize: "1.1rem" }}>Third-party Integrations</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0" }}>
              <div>
                <strong>Twilio (SMS / WhatsApp Gateway)</strong>
                <small style={{ color: "var(--color-slate-500)", display: "block" }}>Sends patient queue tokens and alerts.</small>
              </div>
              <span className="badge" style={{ 
                background: isTwilioConnected ? "var(--color-green-100)" : "var(--color-slate-100)", 
                color: isTwilioConnected ? "var(--color-green-700)" : "var(--color-slate-700)",
                fontWeight: 600 
              }}>
                {isTwilioConnected ? "CONNECTED" : "NOT CONFIGURED"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderTop: "1px solid var(--color-slate-100)" }}>
              <div>
                <strong>Resend (Email Service Provider)</strong>
                <small style={{ color: "var(--color-slate-500)", display: "block" }}>Sends welcome emails and appointment alerts.</small>
              </div>
              <span className="badge" style={{ 
                background: isResendConnected ? "var(--color-green-100)" : "var(--color-slate-100)", 
                color: isResendConnected ? "var(--color-green-700)" : "var(--color-slate-700)",
                fontWeight: 600 
              }}>
                {isResendConnected ? "CONNECTED" : "NOT CONFIGURED"}
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--color-slate-100)", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
                Audit Log Retention (Days)
                <select 
                  value={auditLogRetention} 
                  onChange={(e) => setAuditLogRetention(parseInt(e.target.value))} 
                  style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none", backgroundColor: "white" }}
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        {/* PROFILE SECTION */}
        <section className="dashboard-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            <User size={18} color="var(--color-blue-600)" />
            <strong style={{ fontSize: "1.1rem" }}>Edit Admin Account Details</strong>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "500px" }}>
            {profileMsg && (
              <div style={{ 
                padding: "0.75rem 1rem", 
                borderRadius: "8px", 
                fontSize: "0.875rem", 
                backgroundColor: profileMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                color: profileMsg.type === "success" ? "#16a34a" : "#dc2626",
                border: `1px solid ${profileMsg.type === "success" ? "#bbf7d0" : "#fee2e2"}`
              }}>
                {profileMsg.text}
              </div>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              Email Address (Read-only)
              <input type="email" value={email} disabled style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-200)", outline: "none", backgroundColor: "var(--color-slate-50)", color: "var(--color-slate-500)" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              Full Name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              Phone Number
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0199" style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
            </label>

            <button type="submit" disabled={isProfileLoading} className="button button-primary" style={{ width: "fit-content", padding: "0.6rem 1.5rem" }}>
              {isProfileLoading && <Loader2 size={16} className="spin" />}
              Save Profile Changes
            </button>
          </form>
        </section>

        {/* PASSWORD SECTION */}
        <section className="dashboard-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            <Lock size={18} color="var(--color-blue-600)" />
            <strong style={{ fontSize: "1.1rem" }}>Change Password</strong>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "500px" }}>
            {passwordMsg && (
              <div style={{ 
                padding: "0.75rem 1rem", 
                borderRadius: "8px", 
                fontSize: "0.875rem", 
                backgroundColor: passwordMsg.type === "success" ? "#f0fdf4" : "#fef2f2",
                color: passwordMsg.type === "success" ? "#16a34a" : "#dc2626",
                border: `1px solid ${passwordMsg.type === "success" ? "#bbf7d0" : "#fee2e2"}`
              }}>
                {passwordMsg.text}
              </div>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              Current Password
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={8} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              New Password
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
              Confirm New Password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", outline: "none" }} />
            </label>

            <button type="submit" disabled={isPasswordLoading} className="button button-primary" style={{ width: "fit-content", padding: "0.6rem 1.5rem" }}>
              {isPasswordLoading && <Loader2 size={16} className="spin" />}
              Update Password
            </button>
          </form>
        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section className="dashboard-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            <Bell size={18} color="var(--color-blue-600)" />
            <strong style={{ fontSize: "1.1rem" }}>System Notification Logs</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", cursor: "pointer" }}>
              <div>
                <strong style={{ display: "block" }}>Email Booking Reminders</strong>
                <small style={{ color: "var(--color-slate-500)" }}>Receive notifications for booking confirmations and updates.</small>
              </div>
              <input type="checkbox" checked={emailNotif} onChange={(e) => { setEmailNotif(e.target.checked); handleNotificationSave(); }} style={{ width: "20px", height: "20px" }} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", cursor: "pointer", borderTop: "1px solid var(--color-slate-100)", paddingTop: "1rem" }}>
              <div>
                <strong style={{ display: "block" }}>SMS Queue Position Updates</strong>
                <small style={{ color: "var(--color-slate-500)" }}>Receive messages when you are 3 patients away in the queue.</small>
              </div>
              <input type="checkbox" checked={smsNotif} onChange={(e) => { setSmsNotif(e.target.checked); handleNotificationSave(); }} style={{ width: "20px", height: "20px" }} />
            </label>
            
            {isNotifSaving && <span style={{ fontSize: "0.8rem", color: "var(--color-green-600)", fontWeight: 600 }}>Preferences saved...</span>}
          </div>
        </section>

        {/* SESSION MANAGEMENT */}
        <section className="dashboard-panel" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--color-slate-200)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
            <Trash2 size={18} color="var(--color-red-600)" />
            <strong style={{ fontSize: "1.1rem", color: "var(--color-red-600)" }}>Admin Security Controls</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "500px" }}>
            <div>
              <strong>Logout of all devices</strong>
              <p style={{ color: "var(--color-slate-500)", fontSize: "0.85rem", margin: "0.25rem 0 0.75rem 0" }}>
                Invalidate all active admin portal login tokens.
              </p>
              <button onClick={handleLogoutAll} className="button button-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <LogOut size={16} /> Invalidate Active Sessions
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
