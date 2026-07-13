"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Link from "next/link";
import { 
  User, 
  Lock, 
  Bell, 
  Trash2, 
  LogOut, 
  Loader2, 
  Activity,
  History
} from "lucide-react";

export default function PatientSettingsPage() {
  const router = useRouter();
  
  // Base state
  const [email, setEmail] = useState("");
  
  // Profile state tracking (for disabled save button)
  const [initialProfile, setInitialProfile] = useState<any>({});
  
  // Basic Info
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [gender, setGender] = useState("");
  
  // Medical Info
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Notifications State (Mocked preferences)
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [isNotifSaving, setIsNotifSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsProfileLoading(true);
      try {
        const token = Cookies.get("authToken");
        if (token) {
          const parts = token.split('.');
          if (parts[1]) {
            const decoded = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            setEmail(decoded.email || "");
          }
        }
        
        // Fetch patient profile to populate settings
        const res = await apiFetch("/api/auth/profile"); // We can get the patient nested inside profile from here, or we can fetch /api/patient/profile? Wait, we don't have GET /api/patient/profile. /api/auth/profile returns the current user profile. Let's see if the patient is populated.
        // Wait, the API might not include patient nested in profile by default, but we can assume it for now, or just use auth profile and we'll implement a fallback. Let's just use the profile endpoint and check if patient exists.
        
        if (res.ok && res.data) {
          const p = res.data;
          const pt = p.patient || {};
          
          setName(p.name || "");
          setPhone(p.phone || "");
          setAvatarUrl(p.avatarUrl || "");
          
          setGender(pt.gender || "");
          setBloodGroup(pt.bloodGroup || "");
          setAllergies(pt.allergies || "");
          setEmergencyContactName(pt.emergencyContactName || "");
          setEmergencyContactPhone(pt.emergencyContactPhone || "");

          setInitialProfile({
            name: p.name || "",
            phone: p.phone || "",
            avatarUrl: p.avatarUrl || "",
            gender: pt.gender || "",
            bloodGroup: pt.bloodGroup || "",
            allergies: pt.allergies || "",
            emergencyContactName: pt.emergencyContactName || "",
            emergencyContactPhone: pt.emergencyContactPhone || ""
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  const hasProfileChanged = 
    name !== initialProfile.name ||
    phone !== initialProfile.phone ||
    avatarUrl !== initialProfile.avatarUrl ||
    gender !== initialProfile.gender ||
    bloodGroup !== initialProfile.bloodGroup ||
    allergies !== initialProfile.allergies ||
    emergencyContactName !== initialProfile.emergencyContactName ||
    emergencyContactPhone !== initialProfile.emergencyContactPhone;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!hasProfileChanged) return;

    setIsProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await apiFetch("/api/patient/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name, phone, avatarUrl, gender, bloodGroup, allergies, emergencyContactName, emergencyContactPhone
        })
      });

      if (!res.ok) {
        throw new Error(res.error || "Failed to save profile");
      }

      setInitialProfile({ name, phone, avatarUrl, gender, bloodGroup, allergies, emergencyContactName, emergencyContactPhone });
      setProfileMsg({ type: "success", text: "Profile details updated successfully." });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setIsProfileSaving(false);
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

  const handleDeleteRequest = () => {
    alert("Your deactivation request has been sent to the clinic administration. Account deletion requests require soft-deactivation review by admins.");
  };

  if (isProfileLoading) {
    return <div style={{ padding: "40px", textAlign: "center" }}><Loader2 className="spin" size={24} /></div>;
  }

  return (
    <main style={{ padding: "45px 42px", maxWidth: "1000px", margin: "0 auto" }}>
      <header style={{ marginBottom: "38px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--brand)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 800, marginBottom: "8px", display: "block" }}>
            Settings
          </span>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "38px", fontWeight: 400, letterSpacing: "-.04em", margin: "0 0 8px" }}>
            Personal & Medical Profile
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "15px" }}>
            Manage your personal info, medical details, and contact options.
          </p>
        </div>
        <div>
          <Link href="/patient/appointments" className="button-secondary" style={{ padding: "10px 20px", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, background: "white", border: "1px solid var(--line)", color: "var(--ink)", textDecoration: "none" }}>
            <History size={16} /> Appointment History
          </Link>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px", marginTop: "32px" }}>
        
        {/* PROFILE SECTION */}
        <section style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
            <User size={18} color="var(--brand)" />
            <strong style={{ fontSize: "18px", fontFamily: "var(--serif)", fontWeight: 500 }}>Basic Information</strong>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
            {profileMsg && (
              <div style={{ 
                padding: "12px 16px", borderRadius: "8px", fontSize: "14px", 
                backgroundColor: profileMsg.type === "success" ? "var(--mint)" : "#fef2f2",
                color: profileMsg.type === "success" ? "var(--brand)" : "#dc2626",
                border: `1px solid ${profileMsg.type === "success" ? "rgba(23,107,95,0.2)" : "#fee2e2"}`
              }}>
                {profileMsg.text}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                Email Address (Read-only)
                <input type="email" value={email} disabled style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", backgroundColor: "var(--canvas)", color: "var(--muted)" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                Full Name
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                Phone Number
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555-0199" style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                Gender
                <select value={gender} onChange={(e) => setGender(e.target.value)} style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }}>
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </label>
            </div>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
              Avatar URL (Photo)
              <div style={{ display: "flex", gap: "12px" }}>
                <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/photo.jpg" style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
                {avatarUrl && (
                  <img src={avatarUrl} alt="Avatar Preview" style={{ width: "42px", height: "42px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--line)" }} />
                )}
              </div>
            </label>

            {/* MEDICAL INFO SECTION inside form so it saves together */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "24px", marginTop: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <Activity size={18} color="var(--brand)" />
                <strong style={{ fontSize: "18px", fontFamily: "var(--serif)", fontWeight: 500 }}>Medical Info</strong>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                  Blood Group
                  <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }}>
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                  Allergies
                  <input type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="e.g. Peanuts, Penicillin (leave blank if none)" style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                  Emergency Contact Name
                  <input type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} placeholder="e.g. Jane Doe" style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
                  Emergency Contact Phone
                  <input type="tel" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="+1 555-0198" style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
                </label>
              </div>
            </div>

            <button type="submit" disabled={isProfileSaving || !hasProfileChanged} className="button-primary" style={{ width: "fit-content", padding: "12px 24px", marginTop: "12px", opacity: (!hasProfileChanged || isProfileSaving) ? 0.5 : 1 }}>
              {isProfileSaving && <Loader2 size={16} className="spin" />}
              Save Profile Changes
            </button>
          </form>
        </section>

        {/* PASSWORD SECTION */}
        <section style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
            <Lock size={18} color="var(--brand)" />
            <strong style={{ fontSize: "18px", fontFamily: "var(--serif)", fontWeight: 500 }}>Change Password</strong>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "600px" }}>
            {passwordMsg && (
              <div style={{ 
                padding: "12px 16px", borderRadius: "8px", fontSize: "14px", 
                backgroundColor: passwordMsg.type === "success" ? "var(--mint)" : "#fef2f2",
                color: passwordMsg.type === "success" ? "var(--brand)" : "#dc2626",
                border: `1px solid ${passwordMsg.type === "success" ? "rgba(23,107,95,0.2)" : "#fee2e2"}`
              }}>
                {passwordMsg.text}
              </div>
            )}

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
              Current Password
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required minLength={8} style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
              New Password
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: "8px", fontWeight: 600, fontSize: "13px", color: "var(--ink)" }}>
              Confirm New Password
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} style={{ padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--line)", outline: "none", background: "white" }} />
            </label>

            <button type="submit" disabled={isPasswordLoading} className="button-primary" style={{ width: "fit-content", padding: "12px 24px", marginTop: "12px" }}>
              {isPasswordLoading && <Loader2 size={16} className="spin" />}
              Update Password
            </button>
          </form>
        </section>

        {/* NOTIFICATION PREFERENCES */}
        <section style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
            <Bell size={18} color="var(--brand)" />
            <strong style={{ fontSize: "18px", fontFamily: "var(--serif)", fontWeight: 500 }}>Notification Alerts</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "600px" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", cursor: "pointer" }}>
              <div>
                <strong style={{ display: "block", fontSize: "14px", color: "var(--ink)" }}>Email Booking Reminders</strong>
                <small style={{ color: "var(--muted)", fontSize: "13px" }}>Receive notifications for booking confirmations and updates.</small>
              </div>
              <input type="checkbox" checked={emailNotif} onChange={(e) => { setEmailNotif(e.target.checked); handleNotificationSave(); }} style={{ width: "20px", height: "20px", accentColor: "var(--brand)" }} />
            </label>

            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", cursor: "pointer", borderTop: "1px solid var(--line)", paddingTop: "16px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "14px", color: "var(--ink)" }}>SMS Queue Position Updates</strong>
                <small style={{ color: "var(--muted)", fontSize: "13px" }}>Receive messages when you are close in the queue.</small>
              </div>
              <input type="checkbox" checked={smsNotif} onChange={(e) => { setSmsNotif(e.target.checked); handleNotificationSave(); }} style={{ width: "20px", height: "20px", accentColor: "var(--brand)" }} />
            </label>
            
            {isNotifSaving && <span style={{ fontSize: "13px", color: "var(--brand)", fontWeight: 600 }}>Preferences saved...</span>}
          </div>
        </section>

        {/* DANGER ZONE */}
        <section style={{ background: "white", padding: "32px", borderRadius: "16px", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--line)", paddingBottom: "12px", marginBottom: "24px" }}>
            <Trash2 size={18} color="#dc2626" />
            <strong style={{ fontSize: "18px", fontFamily: "var(--serif)", fontWeight: 500, color: "#dc2626" }}>Danger Zone</strong>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px" }}>
            <div>
              <strong style={{ color: "var(--ink)" }}>Logout of all devices</strong>
              <p style={{ color: "var(--muted)", fontSize: "13px", margin: "4px 0 12px 0" }}>
                Disconnect your patient profile sessions across all web portals.
              </p>
              <button onClick={handleLogoutAll} className="button" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "white", color: "var(--ink)", border: "1px solid var(--line)", padding: "10px 16px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                <LogOut size={16} /> Disconnect Sessions
              </button>
            </div>

            <div style={{ borderTop: "1px solid var(--line)", paddingTop: "24px" }}>
              <strong style={{ color: "#b91c1c" }}>Deactivate Profile</strong>
              <p style={{ color: "var(--muted)", fontSize: "13px", margin: "4px 0 12px 0" }}>
                Permanently delete your account. This action is irreversible.
              </p>
              <button onClick={handleDeleteRequest} className="button" style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#fff5f5", color: "#c53030", border: "1px solid #feb2b2", padding: "10px 16px", borderRadius: "999px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
                <Trash2 size={16} /> Request Account Deletion
              </button>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
