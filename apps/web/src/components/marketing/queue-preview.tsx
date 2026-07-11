import { Bell, Check, Clock3, MapPin } from "lucide-react";

export function QueuePreview() {
  return (
    <div className="hero-visual" aria-label="CuraFlow live appointment preview">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="appointment-card">
        <div className="preview-topline">
          <span>Today&apos;s appointment</span>
          <span className="status-pill"><i /> On time</span>
        </div>
        <div className="doctor-row">
          <div className="doctor-avatar">AM</div>
          <div>
            <strong>Dr. Anika Mehra</strong>
            <span>General medicine</span>
          </div>
          <button className="icon-button" aria-label="Appointment reminders">
            <Bell size={17} strokeWidth={1.8} />
          </button>
        </div>
        <div className="appointment-meta">
          <span><Clock3 size={16} /> 10:30 AM</span>
          <span><MapPin size={16} /> Northside Clinic</span>
        </div>
        <div className="queue-panel">
          <div>
            <span>Now serving</span>
            <strong>A-18</strong>
          </div>
          <div className="queue-divider" />
          <div>
            <span>Your token</span>
            <strong className="token">A-21</strong>
          </div>
          <div className="queue-divider" />
          <div>
            <span>Estimated wait</span>
            <strong>~12 min</strong>
          </div>
        </div>
        <div className="progress-row">
          <span className="done"><Check size={13} /> Checked in</span>
          <span className="progress-track"><i /></span>
          <span>3 ahead</span>
        </div>
      </div>
      <div className="floating-note">
        <span className="note-icon"><Bell size={16} /></span>
        <div><strong>You&apos;re almost up</strong><span>We&apos;ll alert you when it&apos;s time.</span></div>
      </div>
    </div>
  );
}
