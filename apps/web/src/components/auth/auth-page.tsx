"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type AuthPageProps = {
  mode: "login" | "register" | "forgot-password" | "reset-password" | "verify-email";
  redirectTo?: string;
  resetToken?: string;
};

const authPages = {
  login: ["Welcome back", "Log in to manage your appointments and live queue.", "Log in", "New to CuraFlow?", "Create an account"],
  register: ["Create your account", "Your calmer clinic visit starts here.", "Create account", "Already have an account?", "Log in"],
  "forgot-password": ["Reset your password", "Enter your email and we’ll send secure reset instructions.", "Send reset link", "Remembered it?", "Back to log in"],
  "reset-password": ["Choose a new password", "Use a strong password you haven’t used elsewhere.", "Update password", "Need another link?", "Request a new one"],
  "verify-email": ["Check your inbox", "We sent a verification link to your email address.", "Open email app", "Wrong address?", "Start again"]
} as const;

export function AuthPage({ mode, redirectTo = "/patient", resetToken = "" }: AuthPageProps) {
  const router = useRouter();
  const page = authPages[mode];
  const isPasswordPage = mode === "login" || mode === "register" || mode === "reset-password";
  const isEmailOnly = mode !== "reset-password" && mode !== "verify-email";

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const passwordMismatch = mode === "register" && touchedConfirm && password !== confirmPassword;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")?.toString();
    const name = formData.get("name")?.toString() || "User";
    const role = formData.get("role")?.toString() || "patient";

    try {
      let endpoint = "";
      let payload: any = {};

      if (mode === "login") {
        endpoint = "/api/auth/login";
        payload = { email, password };
      } else if (mode === "register") {
        endpoint = "/api/auth/signup";
        payload = { email, password, name, role };
      } else if (mode === "forgot-password") {
        endpoint = "/api/auth/forgot-password";
        payload = { email };
      } else if (mode === "reset-password") {
        endpoint = "/api/auth/reset-password";
        payload = { token: resetToken, password };
      }

      if (!endpoint) return;

      const { apiFetch } = await import("@/lib/api");
      const Cookies = (await import("js-cookie")).default;

      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        setError(res.error || "An error occurred. Please try again.");
        return;
      }

      const data = res.data;

      // Save token if provided
      if (data?.token) {
        Cookies.set("authToken", data.token, { expires: 7, path: "/" });
      }

      if (mode === "login" || mode === "register") {
        router.push(data.redirectTo || redirectTo || "/patient");
        router.refresh();
      } else if (mode === "forgot-password") {
        setSuccessMsg(data?.message || "Check your email for reset instructions.");
      } else if (mode === "reset-password") {
        setSuccessMsg(data?.message || "Password updated successfully. Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err) {
      setError("A network error occurred. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ next: redirectTo }),
      });
      const data = await res.json();
      if (data.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error || "Google login failed");
        setIsLoading(false);
      }
    } catch (err) {
      setError("A network error occurred.");
      setIsLoading(false);
    }
  }

  return (
    <div className="auth-card" style={{ transition: "all 0.3s ease" }}>
      <span className="auth-mobile-brand" style={{ fontWeight: 800, letterSpacing: "-0.5px" }}>CuraFlow</span>
      <h2 style={{ marginBottom: "0.5rem" }}>{page[0]}</h2>
      <p style={{ color: "var(--color-slate-500)", marginBottom: "2rem" }}>{page[1]}</p>
      
      {error && (
        <div role="alert" aria-live="assertive" data-testid="error-message" style={{ backgroundColor: "#fef2f2", color: "#b91c1c", padding: "1rem", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}
      
      {successMsg && (
        <div role="status" aria-live="polite" data-testid="success-message" style={{ backgroundColor: "#f0fdf4", color: "#15803d", padding: "1rem", borderRadius: "8px", border: "1px solid #bbf7d0", marginBottom: "1.5rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {mode === "reset-password" && !resetToken && (
          <div role="alert" style={{ color: "#8a5a00", backgroundColor: "#fefce8", padding: "1rem", borderRadius: "8px", border: "1px solid #fef08a", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
            This reset link is missing or expired. Please request a new password reset email.
          </div>
        )}

        {mode === "register" && (
          <>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem", fontWeight: 500, color: "var(--color-slate-700)" }}>
              I am a...
              <select name="role" required disabled={isLoading} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", transition: "border-color 0.2s, box-shadow 0.2s", outline: "none", backgroundColor: "white" }}>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem", fontWeight: 500, color: "var(--color-slate-700)" }}>
              Full name
              <input name="name" type="text" placeholder="e.g. Jane Doe" required disabled={isLoading} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", transition: "border-color 0.2s, box-shadow 0.2s", outline: "none" }} />
            </label>
          </>
        )}

        {isEmailOnly && (
          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1rem", fontWeight: 500, color: "var(--color-slate-700)" }}>
            Email address
            <input name="email" type="email" placeholder="you@example.com" required disabled={isLoading} style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", transition: "border-color 0.2s, box-shadow 0.2s", outline: "none" }} />
          </label>
        )}

        {isPasswordPage && (
          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: mode === "register" ? "1rem" : "1.5rem", fontWeight: 500, color: "var(--color-slate-700)" }}>
            Password
            <input 
              name="password" 
              type="password" 
              placeholder="At least 8 characters" 
              required 
              minLength={8} 
              disabled={isLoading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--color-slate-300)", transition: "border-color 0.2s, box-shadow 0.2s", outline: "none" }} 
            />
          </label>
        )}

        {mode === "register" && (
          <label style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem", fontWeight: 500, color: "var(--color-slate-700)" }}>
            Confirm Password
            <input 
              name="confirmPassword" 
              type="password" 
              placeholder="Repeat your password" 
              required 
              minLength={8} 
              disabled={isLoading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouchedConfirm(true)}
              style={{ 
                padding: "0.75rem", 
                borderRadius: "8px", 
                border: `1px solid ${passwordMismatch ? "#f87171" : "var(--color-slate-300)"}`, 
                transition: "border-color 0.2s, box-shadow 0.2s", 
                outline: "none" 
              }} 
            />
            {passwordMismatch && (
              <span style={{ color: "#dc2626", fontSize: "0.75rem" }}>Passwords do not match</span>
            )}
          </label>
        )}
        
        {mode !== "verify-email" && (
          <button 
            className="button button-primary" 
            type="submit" 
            disabled={isLoading || passwordMismatch || (mode === "reset-password" && !resetToken)}
            style={{ width: "100%", padding: "0.75rem", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
          >
            {isLoading && <Loader2 size={18} className="spin" />}
            {isLoading ? "Please wait..." : page[2]}
          </button>
        )}

        {mode === "verify-email" && (
          <div style={{ marginTop: "1rem", backgroundColor: "var(--color-slate-50)", padding: "1.5rem", borderRadius: "8px", textAlign: "center" }}>
            <p style={{ margin: 0, color: "var(--color-slate-600)" }}>We've sent a secure link to your email. Click it to verify your account.</p>
          </div>
        )}
      </form>
      
      {(mode === "login" || mode === "register") && (
        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
              <div style={{ width: "100%", borderTop: "1px solid var(--color-slate-200)" }}></div>
            </div>
            <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
              <span style={{ backgroundColor: "white", padding: "0 0.75rem", fontSize: "0.875rem", color: "var(--color-slate-400)" }}>Or</span>
            </div>
          </div>

          <button 
            className="button button-secondary" 
            style={{ width: "100%", padding: "0.75rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem" }} 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={isLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
      )}

      <div className="auth-switch" style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-slate-600)" }}>
        {page[3]} <Link href={mode === "login" ? "/register" : "/login"} style={{ fontWeight: 600, color: "var(--color-blue-600)", textDecoration: "none" }}>{page[4]}</Link>
      </div>
    </div>
  );
}
