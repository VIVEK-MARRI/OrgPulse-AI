import { formatDate, initials } from './utils.js';

export default function MeetingHeader({ meeting }) {
  if (!meeting) return null;

  return (
    <div className="meeting-header-card fade-up">
      <div className="meeting-title-row">
        <h2 style={{ color: 'var(--text-primary)', flex: 1 }}>{meeting.title}</h2>
        {meeting.primary_project && (
          <span className="badge badge-violet">{meeting.primary_project}</span>
        )}
      </div>

      <div className="meeting-meta">
        {meeting.date && <span className="meeting-meta-item">{formatDate(meeting.date)}</span>}
        {meeting.duration_minutes && <span className="meeting-meta-item">{meeting.duration_minutes} min</span>}
        {meeting.participants?.length > 0 && (
          <span className="meeting-meta-item">
            {meeting.participants.length} participant{meeting.participants.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {meeting.participants?.length > 0 && (
        <div className="participants-row">
          {meeting.participants.map((name, i) => (
            <span className="chip" key={i}>
              <span className="chip-avatar">{initials(name)}</span>
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
