import { severityClass } from './utils.js';

export default function EscalationsSection({ escalations }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" style={{ background: 'rgba(244,63,94,0.12)' }}>🚨</div>
          <div className="section-title-group">
            <div className="section-title">Escalations</div>
            <div className="section-count">{escalations.length} item{escalations.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {escalations.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">✔</span>
            No escalations raised
          </div>
        ) : (
          escalations.map(esc => (
            <div className="escalation-item" key={esc.id}>
              <div className="escalation-header">
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {esc.description}
                  </div>
                </div>
                <div className="escalation-badges">
                  {esc.is_blocker && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--color-critical)', fontWeight: 700 }}>
                      <span className="blocker-dot" />
                      BLOCKER
                    </span>
                  )}
                  <span className={`badge ${severityClass(esc.severity)}`}>{esc.severity}</span>
                  <span className="badge badge-neutral font-mono text-xs">{esc.id}</span>
                </div>
              </div>

              {/* Escalation path */}
              <div className="escalation-path">
                {esc.raised_by && (
                  <>
                    <span className="escalation-path-name">{esc.raised_by}</span>
                    <span>→</span>
                  </>
                )}
                {esc.escalated_to && (
                  <span className="escalation-path-name" style={{ color: 'var(--text-accent)' }}>
                    {esc.escalated_to}
                  </span>
                )}
                {esc.related_project && (
                  <>
                    <span>·</span>
                    <span className="badge badge-violet" style={{ fontSize: '0.65rem', padding: '2px 7px' }}>
                      {esc.related_project}
                    </span>
                  </>
                )}
              </div>

              {esc.source_quote && (
                <div className="source-quote">"{esc.source_quote}"</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
