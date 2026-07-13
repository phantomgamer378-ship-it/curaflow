import { apiFetch } from "@/lib/api";
import { 
  Stethoscope, 
  MapPin, 
  Clock, 
  Globe, 
  GraduationCap, 
  Award, 
  Banknote,
  Calendar,
  ChevronRight,
  User
} from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/layout/brand";

export default async function PublicDoctorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try to fetch doctor details from our public endpoint
  let doctor: any = null;
  let errorMsg = null;
  
  try {
    const res = await apiFetch(`/api/doctors/${id}`);
    if (res.ok && res.data) {
      doctor = res.data;
    } else {
      errorMsg = res.error || "Doctor not found";
    }
  } catch (e: any) {
    errorMsg = e.message || "Failed to load doctor profile";
  }

  if (errorMsg || !doctor) {
    return (
      <div style={{ padding: "40px", textAlign: "center", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", background: "var(--canvas)" }}>
        <h1 style={{ fontFamily: "var(--serif)", color: "var(--ink)", marginBottom: "16px" }}>Profile Not Found</h1>
        <p style={{ color: "var(--muted)" }}>{errorMsg}</p>
        <Link href="/" style={{ color: "var(--brand)", marginTop: "24px", fontWeight: 600 }}>Return Home</Link>
      </div>
    );
  }

  const languages = doctor.languages ? doctor.languages.split(",").map((l: string) => l.trim()).filter(Boolean) : [];
  
  // Group availability by weekday
  const weekDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const availabilityMap: Record<number, any[]> = {};
  if (doctor.availabilities) {
    doctor.availabilities.forEach((avail: any) => {
      if (!availabilityMap[avail.weekday]) {
        availabilityMap[avail.weekday] = [];
      }
      availabilityMap[avail.weekday]!.push(avail);
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--canvas)" }}>
      {/* ── Navbar ────────────────────────────────────────────── */}
      <header style={{ 
        background: "white", padding: "16px 40px", borderBottom: "1px solid var(--line)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <Brand />
        <Link href="/patient" style={{ fontSize: "14px", fontWeight: 600, color: "var(--brand)", display: "flex", alignItems: "center", gap: "4px" }}>
          Book Appointment <ChevronRight size={16} />
        </Link>
      </header>

      {/* ── Main Content ──────────────────────────────────────── */}
      <main style={{ maxWidth: "800px", margin: "40px auto", padding: "0 24px" }}>
        
        {/* Profile Header Card */}
        <section style={{ 
          background: "white", borderRadius: "24px", border: "1px solid var(--line)", 
          padding: "32px", display: "flex", gap: "32px", alignItems: "flex-start",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "32px"
        }}>
          {/* Avatar */}
          <div style={{ 
            width: "140px", height: "140px", borderRadius: "50%", background: "var(--mint)", 
            border: "4px solid white", boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0
          }}>
            {doctor.profile?.avatarUrl ? (
              <img src={doctor.profile.avatarUrl} alt={doctor.profile.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Stethoscope size={64} color="var(--brand)" opacity={0.5} />
            )}
          </div>
          
          {/* Info */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ margin: 0, fontFamily: "var(--serif)", fontSize: "32px", color: "var(--ink)", fontWeight: 500 }}>
                Dr. {doctor.profile?.name}
              </h1>
              {doctor.isOnline ? (
                <span style={{ background: "var(--mint)", color: "var(--brand)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand)" }} />
                  Live Now
                </span>
              ) : (
                <span style={{ background: "var(--canvas)", color: "var(--muted)", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                  Offline
                </span>
              )}
            </div>
            
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px", color: "var(--brand)", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}>
              {doctor.specialty || "General Medicine"}
            </h2>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", color: "var(--muted)", fontSize: "14px" }}>
              {doctor.yearsExperience && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={16} /> {doctor.yearsExperience} Years Experience
                </div>
              )}
              {doctor.clinic?.name && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <MapPin size={16} /> {doctor.clinic.name}
                </div>
              )}
              {doctor.consultationFee && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Banknote size={16} /> ${doctor.consultationFee} Consultation
                </div>
              )}
            </div>
            
            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid var(--line)" }}>
              <Link href={`/patient?doctor=${doctor.id}`} className="button-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                Book Appointment
              </Link>
            </div>
          </div>
        </section>

        {/* Detailed Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Bio */}
            {doctor.bio && (
              <section>
                <h3 style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={18} color="var(--brand)" /> About Dr. {doctor.profile?.name}
                </h3>
                <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: "15px", whiteSpace: "pre-wrap" }}>
                  {doctor.bio}
                </p>
              </section>
            )}

            {/* Qualifications */}
            {doctor.qualifications && (
              <section>
                <h3 style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <GraduationCap size={18} color="var(--brand)" /> Qualifications
                </h3>
                <div style={{ padding: "16px", background: "white", borderRadius: "12px", border: "1px solid var(--line)", color: "var(--ink)", fontSize: "14px", fontWeight: 500 }}>
                  {doctor.qualifications}
                </div>
              </section>
            )}
            
            {/* Languages */}
            {languages.length > 0 && (
              <section>
                <h3 style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Globe size={18} color="var(--brand)" /> Languages Spoken
                </h3>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {languages.map((lang: string, i: number) => (
                    <span key={i} style={{ padding: "6px 12px", background: "var(--mint)", color: "var(--brand)", borderRadius: "999px", fontSize: "13px", fontWeight: 600 }}>
                      {lang}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
          
          <div>
            {/* Availability Preview */}
            <section style={{ background: "white", padding: "24px", borderRadius: "16px", border: "1px solid var(--line)" }}>
              <h3 style={{ fontSize: "16px", color: "var(--ink)", fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Calendar size={18} color="var(--brand)" /> Weekly Schedule
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {weekDays.map((dayName, idx) => {
                  const dayAvails = availabilityMap[idx];
                  if (!dayAvails || dayAvails.length === 0) return null;
                  
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--canvas)", paddingBottom: "8px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--ink)" }}>{dayName}</span>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        {dayAvails.map((a: any, i: number) => (
                          <span key={i} style={{ fontSize: "13px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Clock size={12} /> {a.startTime} - {a.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {Object.keys(availabilityMap).length === 0 && (
                  <div style={{ color: "var(--muted)", fontSize: "13px", textAlign: "center", padding: "16px 0" }}>
                    No schedule available.
                  </div>
                )}
              </div>
            </section>
          </div>
          
        </div>
      </main>
    </div>
  );
}
