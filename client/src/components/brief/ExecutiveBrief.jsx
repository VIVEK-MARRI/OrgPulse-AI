import OrgHealthGauge from './OrgHealthGauge.jsx';
import { severityClass } from '../dashboard/utils.js';

function SectionCard({ title, count, children }) {
  return (
    <div className="section-card dashboard-section fade-up">
      <div className="section-header">
        <div className="section-icon" aria-hidden="true" />
        <div className="section-title-group">
          <div className="section-title">{title}</div>
          {count !== undefined && <div className="section-count">{count} item{count !== 1 ? 's' : ''}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ProjectHealthBar({ score, health }) {
  const color = health === 'CRITICAL' ? 'var(--color-critical)'
    : health === 'WARNING' ? 'var(--color-medium)'
    : 'var(--color-low)';

  return (
    <div className="project-health-bar">
      <div className="project-health-track">
        <div className="project-health-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span style={{ color }}>{score}</span>
    </div>
  );
}

export default function ExecutiveBrief({ brief }) {
  if (!brief) return null;

  return (
    <div>
      <div className="executive-hero fade-up">
        <OrgHealthGauge score={brief.health_score} label={brief.org_health} />
        <div className="executive-summary">
          <div className="eyebrow">Executive Summary</div>
          <p>{brief.leadership_summary}</p>
        </div>
        <div className="intel-score">
          <span>{brief.meeting_intelligence_score}</span>
          <small>Intel Score</small>
        </div>
      </div>

      {brief.top_risks?.length > 0 && (
        <SectionCard title="Top Risks" count={brief.top_risks.length}>
          {brief.top_risks.map(risk => (
            <div key={risk.rank} className="brief-list-item">
              <div className="rank-badge">{risk.rank}</div>
              <div className="brief-list-content">
                <div className="item-title">{risk.description}</div>
                <div className="brief-meta-row">
                  <span className={`badge ${severityClass(risk.severity)}`}>{risk.severity}</span>
                  <span className="badge badge-neutral">P: {risk.probability}</span>
                  {risk.impact_area && <span className="badge badge-violet">{risk.impact_area}</span>}
                  {risk.owner && <span className="text-sm">Owner: <strong>{risk.owner}</strong></span>}
                </div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {brief.top_blockers?.length > 0 && (
        <SectionCard title="Top Blockers" count={brief.top_blockers.length}>
          {brief.top_blockers.map((blocker, i) => (
            <div key={i} className="brief-list-item">
              <span className="status-dot status-dot-danger" />
              <div className="brief-list-content">
                <div className="item-title">{blocker.description}</div>
                <div className="brief-meta-row">
                  <span className={`badge ${severityClass(blocker.severity)}`}>{blocker.severity}</span>
                  {blocker.affected_project && <span className="badge badge-violet">{blocker.affected_project}</span>}
                </div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {brief.critical_projects?.length > 0 && (
        <SectionCard title="Project Health" count={brief.critical_projects.length}>
          <div className="project-health-list">
            {brief.critical_projects.map((project, i) => (
              <div key={i} className="project-health-item">
                <div className="project-health-copy">
                  <div className="item-title">{project.name}</div>
                  <div className="text-sm text-muted">{project.reason}</div>
                  <div className="brief-meta-row">
                    <span className="badge badge-neutral">{project.open_tasks} tasks</span>
                    <span className="badge badge-neutral">{project.open_escalations} escalations</span>
                    <span className="badge badge-neutral">{project.open_risks} risks</span>
                  </div>
                </div>
                <ProjectHealthBar score={project.project_health_score} health={project.health} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {brief.recommended_actions?.length > 0 && (
        <SectionCard title="Recommended Actions" count={brief.recommended_actions.length}>
          {brief.recommended_actions.map(action => (
            <div key={action.priority} className="brief-list-item">
              <div className="rank-badge">{action.priority}</div>
              <div className="brief-list-content">
                <div className="item-title">{action.action}</div>
                {action.rationale && <div className="text-sm text-muted">{action.rationale}</div>}
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      <div className="brief-two-column">
        <div className="section-card fade-up">
          <div className="section-header">
            <div className="section-icon" aria-hidden="true" />
            <div className="section-title-group">
              <div className="section-title">Overloaded Owners</div>
              <div className="section-count">{brief.overloaded_owners?.length || 0}</div>
            </div>
          </div>
          {!brief.overloaded_owners?.length ? (
            <div className="empty-state">No overloaded owners</div>
          ) : (
            brief.overloaded_owners.map((owner, i) => (
              <div key={i} className="owner-load-item">
                <div className="brief-meta-row">
                  <span className="item-title">{owner.name}</span>
                  <span className="badge badge-high">{owner.open_task_count} tasks</span>
                </div>
                {owner.tasks?.map((task, j) => <div key={j} className="text-sm text-muted">{task}</div>)}
              </div>
            ))
          )}
        </div>

        <div className="section-card fade-up">
          <div className="section-header">
            <div className="section-icon" aria-hidden="true" />
            <div className="section-title-group">
              <div className="section-title">Unassigned Tasks</div>
              <div className="section-count">{brief.unassigned_tasks?.length || 0}</div>
            </div>
          </div>
          {!brief.unassigned_tasks?.length ? (
            <div className="empty-state">All tasks are assigned</div>
          ) : (
            brief.unassigned_tasks.map((task, i) => (
              <div key={i} className="brief-list-item compact">
                <span className={`badge ${severityClass(task.priority)}`}>{task.priority}</span>
                <div>
                  <div className="item-title">{task.title}</div>
                  {task.project && <div className="text-sm text-muted">{task.project}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
