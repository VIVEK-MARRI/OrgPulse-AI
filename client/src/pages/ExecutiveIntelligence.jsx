import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { severityClass } from '../utils/severity.js';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import OrgHealthGauge from '../features/executive/OrgHealthGauge.jsx';

function SectionCard({ title, count, children }) {
  return (
    <div className="section-card dashboard-section fade-up">
      <div className="section-header">
        <div className="section-icon" />
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

export default function ExecutiveIntelligence() {
  const [brief] = useState(() => {
    try {
      const stored = localStorage.getItem('orgpulse_last_analysis');
      if (stored) return JSON.parse(stored).brief || null;
    } catch { /* no stored data */ }
    return null;
  });

  if (!brief) {
    return (
      <div>
        <PageHeader
          title="Executive Intelligence"
          description="AI-powered organizational synthesis from meeting data"
        />
        <EmptyState
          title="No executive brief available"
          description="Analyze a meeting transcript to generate an executive intelligence report."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Executive Intelligence"
        description="AI-powered organizational synthesis from meeting data"
      />

      <div className="executive-hero fade-up" style={{ marginBottom: 'var(--space-5)' }}>
        <OrgHealthGauge score={brief.health_score} label={brief.org_health} />
        <div className="executive-summary">
          <div className="eyebrow" style={{ marginBottom: 4 }}>Executive Summary</div>
          <p>{brief.leadership_summary}</p>
        </div>
        <div className="intel-score">
          <span>{brief.meeting_intelligence_score}</span>
          <small>Intel Score</small>
        </div>
      </div>

      <div className="exec-intel-content">
        {brief.top_risks?.length > 0 && (
          <SectionCard title="Top Risks" count={brief.top_risks.length}>
            {brief.top_risks.map(risk => (
              <div key={risk.rank} className="brief-list-item">
                <div className="rank-badge">{risk.rank}</div>
                <div className="brief-list-content">
                  <div className="item-title">{risk.description}</div>
                  <div className="brief-meta-row">
                    <Badge variant={severityClass(risk.severity)}>{risk.severity}</Badge>
                    <span className="badge badge-neutral">P: {risk.probability}</span>
                    {risk.impact_area && <Badge variant="info">{risk.impact_area}</Badge>}
                    {risk.owner && <span className="text-sm text-secondary">Owner: <strong>{risk.owner}</strong></span>}
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
                    <Badge variant={severityClass(blocker.severity)}>{blocker.severity}</Badge>
                    {blocker.affected_project && <Badge variant="info">{blocker.affected_project}</Badge>}
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
                      <Badge variant="neutral">{project.open_tasks} tasks</Badge>
                      <Badge variant="neutral">{project.open_escalations} escalations</Badge>
                      <Badge variant="neutral">{project.open_risks} risks</Badge>
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
          <Card>
            <CardBody style={{ padding: 0 }}>
              <div className="section-header">
                <div className="section-icon" />
                <div className="section-title-group">
                  <div className="section-title">Overloaded Owners</div>
                  <div className="section-count">{brief.overloaded_owners?.length || 0}</div>
                </div>
              </div>
              {!brief.overloaded_owners?.length ? (
                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>No overloaded owners</div>
              ) : (
                brief.overloaded_owners.map((owner, i) => (
                  <div key={i} className="brief-list-item">
                    <div className="brief-list-content">
                      <div className="item-title">{owner.name}</div>
                      <div className="brief-meta-row">
                        <Badge variant="high">{owner.open_task_count} tasks</Badge>
                      </div>
                      {owner.tasks?.map((task, j) => <div key={j} className="text-sm text-muted">{task}</div>)}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody style={{ padding: 0 }}>
              <div className="section-header">
                <div className="section-icon" />
                <div className="section-title-group">
                  <div className="section-title">Unassigned Tasks</div>
                  <div className="section-count">{brief.unassigned_tasks?.length || 0}</div>
                </div>
              </div>
              {!brief.unassigned_tasks?.length ? (
                <div className="empty-state" style={{ padding: 'var(--space-6)' }}>All tasks are assigned</div>
              ) : (
                brief.unassigned_tasks.map((task, i) => (
                  <div key={i} className="brief-list-item compact">
                    <Badge variant={severityClass(task.priority)}>{task.priority}</Badge>
                    <div>
                      <div className="item-title">{task.title}</div>
                      {task.project && <div className="text-sm text-muted">{task.project}</div>}
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
