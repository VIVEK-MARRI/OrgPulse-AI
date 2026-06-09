import { initials } from './utils.js';

export default function StakeholdersSection({ stakeholders }) {
  return (
    <div className="dashboard-section fade-up">
      <div className="section-card">
        <div className="section-header">
          <div className="section-icon" aria-hidden="true" />
          <div className="section-title-group">
            <div className="section-title">Stakeholders</div>
            <div className="section-count">{stakeholders.length} participant{stakeholders.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {stakeholders.length === 0 ? (
          <div className="empty-state">No stakeholders identified</div>
        ) : (
          <div className="stakeholder-grid">
            {stakeholders.map((s, i) => (
              <div className="stakeholder-card" key={i}>
                <div className="stakeholder-avatar">{initials(s.name)}</div>
                <div className="stakeholder-info">
                  <div className="stakeholder-name">{s.name}</div>
                  {s.team && <div className="stakeholder-team">{s.team}</div>}
                  {s.role_in_meeting && <div className="stakeholder-role">{s.role_in_meeting}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
