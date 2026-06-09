import { severityClass } from './utils.js';

export default function EscalationsSection({ escalations }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true" />
          <div className="section-title-group">
            <div className="section-title">Escalations</div>
            <div className="section-count">{escalations.length} item{escalations.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {escalations.length === 0 ? (
          <div className="empty-state">No escalations raised</div>
        ) : (
          escalations.map(esc => (
            <div className="escalation-item" key={esc.id}>
              <div className="escalation-header">
                <div className="item-title">{esc.description}</div>
                <div className="escalation-badges">
                  {esc.is_blocker && <span className="badge badge-critical">Blocker</span>}
                  <span className={`badge ${severityClass(esc.severity)}`}>{esc.severity}</span>
                  <span className="badge badge-neutral font-mono text-xs">{esc.id}</span>
                </div>
              </div>

              <div className="escalation-path">
                {esc.raised_by && <span className="escalation-path-name">{esc.raised_by}</span>}
                {esc.raised_by && esc.escalated_to && <span>to</span>}
                {esc.escalated_to && <span className="escalation-path-name">{esc.escalated_to}</span>}
                {esc.related_project && <span className="badge badge-violet">{esc.related_project}</span>}
              </div>

              {esc.source_quote && <div className="source-quote">"{esc.source_quote}"</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
