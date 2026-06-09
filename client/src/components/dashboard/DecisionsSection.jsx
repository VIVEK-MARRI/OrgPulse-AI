import { decisionDotStyle, decisionTypeClass } from './utils.js';

const DECISION_LABELS = {
  COMMITTED:     'Committed',
  DEFERRED:      'Deferred',
  OPEN_QUESTION: 'Open Question',
};

export default function DecisionsSection({ decisions }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" style={{ background: 'rgba(6,182,212,0.12)' }}>⚡</div>
          <div className="section-title-group">
            <div className="section-title">Decisions</div>
            <div className="section-count">{decisions.length} item{decisions.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {decisions.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">📝</span>
            No decisions recorded
          </div>
        ) : (
          decisions.map(decision => (
            <div className="decision-item" key={decision.id}>
              <div
                className="decision-timeline-dot"
                style={decisionDotStyle(decision.type)}
              />
              <div className="decision-content">
                <div className="decision-description">{decision.description}</div>
                <div className="decision-meta">
                  <span className={`badge ${decisionTypeClass(decision.type)}`}>
                    {DECISION_LABELS[decision.type] || decision.type}
                  </span>
                  {decision.made_by && (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      by <strong style={{ color: 'var(--text-primary)' }}>{decision.made_by}</strong>
                    </span>
                  )}
                  <span className="badge badge-neutral font-mono text-xs">{decision.id}</span>
                </div>
                {decision.rationale && (
                  <div className="decision-rationale">Rationale: {decision.rationale}</div>
                )}
                {decision.source_quote && (
                  <div className="source-quote">"{decision.source_quote}"</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
