import './recurring.css';

const TRAJECTORY_META = {
  WORSENING: { label: 'Worsening' },
  STABLE: { label: 'Stable' },
  IMPROVING: { label: 'Improving' },
};

function occurrenceClass(count) {
  if (count >= 3) return 'occurrence-high';
  if (count === 2) return 'occurrence-med';
  return 'occurrence-low';
}

function formatDate(d) {
  if (!d) return 'None';
  try {
    return new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return d;
  }
}

export default function RecurringRiskCard({ cluster }) {
  const analysis = cluster.analysis;
  const severity = analysis?.combined_severity || 'MEDIUM';
  const trajectory = analysis?.escalation_trajectory;
  const trajectoryMeta = trajectory ? TRAJECTORY_META[trajectory] : null;

  const description = analysis?.canonical_description
    || cluster.related_items?.[0]?.description
    || 'Recurring issue detected';

  const rootCause = analysis?.root_cause_hypothesis;
  const recommendedAction = analysis?.recommended_action;
  const owners = analysis?.involved_owners?.filter(Boolean) || [];
  const projects = analysis?.affected_projects?.filter(Boolean) || [];
  const daysOpen = analysis?.days_open ?? daysBetween(cluster.first_seen, cluster.last_seen);
  const status = analysis?.current_status || 'OPEN';

  return (
    <div className="recurring-card fade-up" data-severity={severity}>
      <div className="recurring-card-header">
        <div className="recurring-card-title">{description}</div>
        <div className="recurring-card-meta">
          <span className={`badge ${severityClass(severity)}`}>{severity}</span>
          <span className={`occurrence-pill ${occurrenceClass(cluster.occurrence_count)}`}>
            {cluster.occurrence_count}x meetings
          </span>
          {trajectoryMeta && (
            <span className={`trajectory-badge trajectory-${trajectory}`}>
              {trajectoryMeta.label}
            </span>
          )}
        </div>
      </div>

      <div className="recurring-card-body">
        <div className="timeline-row">
          <span>First seen <strong>{formatDate(cluster.first_seen)}</strong></span>
          <span className="muted-separator">/</span>
          <span>Last seen <strong>{formatDate(cluster.last_seen)}</strong></span>
          <span className="days-open-badge">{daysOpen} day{daysOpen !== 1 ? 's' : ''} open</span>
          <span className={`badge ${status === 'OPEN' ? 'badge-critical' : status === 'PARTIALLY_RESOLVED' ? 'badge-medium' : 'badge-low'}`}>
            {status.replace('_', ' ')}
          </span>
        </div>

        <div>
          <div className="eyebrow meetings-label">Appeared in</div>
          <div className="meetings-row">
            {cluster.related_items?.map((item, i) => (
              <span key={i} className="meeting-chip">{item.meeting_title || item.meeting_id}</span>
            ))}
          </div>
        </div>

        {rootCause && (
          <div className="root-cause-row">
            <strong>Root Cause Hypothesis</strong>
            <span>{rootCause}</span>
          </div>
        )}

        {(owners.length > 0 || projects.length > 0) && (
          <div className="recurring-entity-grid">
            {owners.length > 0 && (
              <div className="chips-row">
                <span className="chip-label">Owners</span>
                {owners.map((owner, i) => <span key={i} className="badge badge-violet">{owner}</span>)}
              </div>
            )}
            {projects.length > 0 && (
              <div className="chips-row">
                <span className="chip-label">Projects</span>
                {projects.map((project, i) => <span key={i} className="badge badge-neutral">{project}</span>)}
              </div>
            )}
          </div>
        )}

        {recommendedAction && (
          <div className="recurring-action-box">
            <div>
              <div className="recurring-action-label">Recommended Action</div>
              <div className="recurring-action-text">{recommendedAction}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function severityClass(s) {
  return s === 'CRITICAL' ? 'badge-critical'
    : s === 'HIGH' ? 'badge-high'
    : s === 'MEDIUM' ? 'badge-medium'
    : 'badge-low';
}

function daysBetween(a, b) {
  try {
    const ms = new Date(b || Date.now()) - new Date(a || Date.now());
    return Math.max(0, Math.round(ms / 86400000));
  } catch {
    return 0;
  }
}
