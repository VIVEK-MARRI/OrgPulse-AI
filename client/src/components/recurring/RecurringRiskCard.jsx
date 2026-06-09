import './recurring.css';

const TRAJECTORY_META = {
  WORSENING: { icon: '↑', label: 'Worsening' },
  STABLE:    { icon: '→', label: 'Stable'    },
  IMPROVING: { icon: '↓', label: 'Improving' },
};

function occurrenceClass(count) {
  if (count >= 3) return 'occurrence-high';
  if (count === 2) return 'occurrence-med';
  return 'occurrence-low';
}

function formatDate(d) {
  if (!d) return '—';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

// ── RecurringRiskCard ─────────────────────────────────────────────────────────

export default function RecurringRiskCard({ cluster }) {
  // Use AI analysis if available, fall back to raw cluster data
  const a   = cluster.analysis;
  const sev = a?.combined_severity || 'MEDIUM';
  const traj = a?.escalation_trajectory;
  const trajMeta = traj ? TRAJECTORY_META[traj] : null;

  const description = a?.canonical_description
    || cluster.related_items?.[0]?.description
    || 'Recurring issue detected';

  const rootCause       = a?.root_cause_hypothesis;
  const recommendedAction = a?.recommended_action;
  const owners          = a?.involved_owners?.filter(Boolean) || [];
  const projects        = a?.affected_projects?.filter(Boolean) || [];
  const daysOpen        = a?.days_open ?? daysBetween(cluster.first_seen, cluster.last_seen);
  const status          = a?.current_status || 'OPEN';

  return (
    <div
      className="recurring-card fade-up"
      data-severity={sev}
    >
      {/* ── Header ── */}
      <div className="recurring-card-header">
        <div className="recurring-card-title">{description}</div>
        <div className="recurring-card-meta">
          <span className={`badge ${severityClass(sev)}`}>{sev}</span>
          <span className={`occurrence-pill ${occurrenceClass(cluster.occurrence_count)}`}>
            🔁 {cluster.occurrence_count}× meetings
          </span>
          {trajMeta && (
            <span className={`trajectory-badge trajectory-${traj}`}>
              {trajMeta.icon} {trajMeta.label}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="recurring-card-body">
        {/* Timeline */}
        <div className="timeline-row">
          <span className="timeline-dot" />
          <span>First seen <strong>{formatDate(cluster.first_seen)}</strong></span>
          <span style={{ color: 'var(--border-subtle)' }}>·</span>
          <span>Last seen <strong>{formatDate(cluster.last_seen)}</strong></span>
          <span className="days-open-badge">
            {daysOpen} day{daysOpen !== 1 ? 's' : ''} open
          </span>
          <span className={`badge ${status === 'OPEN' ? 'badge-critical' : status === 'PARTIALLY_RESOLVED' ? 'badge-medium' : 'badge-low'}`}
            style={{ fontSize: '0.62rem' }}>
            {status.replace('_', ' ')}
          </span>
        </div>

        {/* Meeting appearances */}
        <div>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            Appeared in
          </div>
          <div className="meetings-row">
            {cluster.related_items?.map((item, i) => (
              <span key={i} className="meeting-chip">
                📅 {item.meeting_title || item.meeting_id}
              </span>
            ))}
          </div>
        </div>

        {/* Root cause */}
        {rootCause && (
          <div className="root-cause-row">
            <strong style={{ fontStyle: 'normal', color: 'var(--text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Root Cause Hypothesis
            </strong>
            <br />
            {rootCause}
          </div>
        )}

        {/* Owners + Projects */}
        {(owners.length > 0 || projects.length > 0) && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {owners.length > 0 && (
              <div className="chips-row">
                <span className="chip-label">Owners:</span>
                {owners.map((o, i) => (
                  <span key={i} className="badge badge-violet" style={{ fontSize: '0.68rem' }}>👤 {o}</span>
                ))}
              </div>
            )}
            {projects.length > 0 && (
              <div className="chips-row">
                <span className="chip-label">Projects:</span>
                {projects.map((p, i) => (
                  <span key={i} className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>🏗 {p}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recommended action */}
        {recommendedAction && (
          <div className="recurring-action-box">
            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>🎯</span>
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

// ── helpers ───────────────────────────────────────────────────────────────────

function severityClass(s) {
  return s === 'CRITICAL' ? 'badge-critical'
       : s === 'HIGH'     ? 'badge-high'
       : s === 'MEDIUM'   ? 'badge-medium'
       :                    'badge-low';
}

function daysBetween(a, b) {
  try {
    const ms = new Date(b || Date.now()) - new Date(a || Date.now());
    return Math.max(0, Math.round(ms / 86400000));
  } catch { return 0; }
}
