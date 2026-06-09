import { severityClass, heatLevel } from './utils.js';

function HeatBar({ probability, severity }) {
  const level = heatLevel(probability, severity);
  const colorClass = level >= 3 ? '' : level === 2 ? 'medium' : 'low';

  return (
    <div className="heat-bar" title={`Probability: ${probability} · Severity: ${severity}`}>
      {[1, 2, 3, 4].map(i => (
        <div
          key={i}
          className={`heat-dot ${i <= level ? `active ${colorClass}` : ''}`}
        />
      ))}
    </div>
  );
}

export default function RisksSection({ risks }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" style={{ background: 'rgba(249,115,22,0.12)' }}>⚠️</div>
          <div className="section-title-group">
            <div className="section-title">Risks</div>
            <div className="section-count">{risks.length} item{risks.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {risks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">🛡</span>
            No risks identified
          </div>
        ) : (
          risks.map(risk => (
            <div className="risk-item" key={risk.id}>
              <div className="risk-header">
                <div style={{ flex: 1 }}>
                  <div className="risk-description">{risk.description}</div>
                </div>
                <div className="flex gap-2 items-center" style={{ flexShrink: 0 }}>
                  <HeatBar probability={risk.probability} severity={risk.severity} />
                  <span className={`badge ${severityClass(risk.severity)}`}>{risk.severity}</span>
                  <span className="badge badge-neutral font-mono text-xs">{risk.id}</span>
                </div>
              </div>

              {risk.trigger && (
                <div className="risk-trigger">
                  <span style={{ color: 'var(--text-muted)' }}>Trigger: </span>
                  {risk.trigger}
                </div>
              )}

              {risk.impact_area && (
                <div className="risk-trigger">
                  <span style={{ color: 'var(--text-muted)' }}>Impact: </span>
                  <span className="badge badge-violet" style={{ fontSize: '0.65rem', padding: '2px 7px', verticalAlign: 'middle' }}>
                    {risk.impact_area}
                  </span>
                </div>
              )}

              {risk.mitigation_mentioned && (
                <div className="risk-mitigation">
                  <span>🛡</span>
                  <span>{risk.mitigation_mentioned}</span>
                </div>
              )}

              {risk.source_quote && (
                <div className="source-quote">"{risk.source_quote}"</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
