import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { severityClass } from '../utils/severity.js';
import { EmptyState } from '../components/ui/EmptyState.jsx';

function loadData() {
  try {
    const stored = localStorage.getItem('orgpulse_last_analysis');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { extraction: parsed.extraction || null, brief: parsed.brief || null };
    }
    } catch { /* no stored data */ }
    return { extraction: null, brief: null };
}

function ProjectCard({ name, reason, health, score, tasks, risks, escalations }) {
  const color = health === 'CRITICAL' ? 'var(--color-critical)'
    : health === 'WARNING' ? 'var(--color-medium)'
    : 'var(--color-low)';

  return (
    <div className="project-card">
      <div className="project-card-header">
        <div className="project-card-name">{name}</div>
        <Badge variant={severityClass(health)}>{health}</Badge>
      </div>

      {reason && <div className="text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>{reason}</div>}

      <div className="project-card-stats">
        <div className="project-stat">
          <span className="project-stat-value" style={{ color }}>{score}</span>
          <span className="project-stat-label">Health Score</span>
        </div>
        <div className="project-stat">
          <span className="project-stat-value">{tasks !== undefined ? tasks : '--'}</span>
          <span className="project-stat-label">Open Tasks</span>
        </div>
        <div className="project-stat">
          <span className="project-stat-value">{risks !== undefined ? risks : '--'}</span>
          <span className="project-stat-label">Open Risks</span>
        </div>
        <div className="project-stat">
          <span className="project-stat-value">{escalations !== undefined ? escalations : '--'}</span>
          <span className="project-stat-label">Escalations</span>
        </div>
      </div>

      <div className="project-health-row">
        <div className="project-health-bar-bg">
          <div className="project-health-fill-bar" style={{ width: `${score}%`, background: color }} />
        </div>
        <span className="project-health-score" style={{ color }}>{score}/100</span>
      </div>
    </div>
  );
}

export default function Projects() {
  const [{ extraction, brief }] = useState(loadData);

  if (!extraction) {
    return (
      <div>
        <PageHeader title="Projects" description="Project health dashboard" />
        <EmptyState
          title="No project data available"
          description="Analyze a meeting transcript to surface project information."
        />
      </div>
    );
  }

  const hasBriefProjects = brief?.critical_projects?.length > 0;
  const tasksList = extraction.tasks || [];
  const risksList = extraction.risks || [];
  const escalationsList = extraction.escalations || [];
  const dependenciesList = extraction.dependencies || [];
  const decisionsList = extraction.decisions || [];

  const projects = [];
  if (hasBriefProjects) {
    brief.critical_projects.forEach(p => {
      projects.push({
        name: p.name,
        health: p.health || 'WARNING',
        score: p.project_health_score || 50,
        reason: p.reason || '',
        tasks: p.open_tasks || 0,
        risks: p.open_risks || 0,
        escalations: p.open_escalations || 0,
      });
    });
  }

  const primaryProject = extraction.meeting?.primary_project;
  if (primaryProject && !projects.find(p => p.name === primaryProject)) {
    projects.unshift({
      name: primaryProject,
      health: brief?.org_health || 'WARNING',
      score: brief?.health_score || 50,
      reason: 'Primary project from current meeting',
      tasks: tasksList.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED').length,
      risks: risksList.length,
      escalations: escalationsList.length,
    });
  }

  if (projects.length === 0) {
    projects.push({
      name: extraction.meeting?.title || 'Unnamed Project',
      health: 'WARNING',
      score: 70,
      reason: 'Project data inferred from meeting',
      tasks: tasksList.filter(t => t.status !== 'DONE').length,
      risks: risksList.length,
      escalations: escalationsList.length,
    });
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        description="Project health dashboard"
      />

      {dependenciesList.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-body">
            <div className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Dependencies</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>From</th>
                    <th>Type</th>
                    <th>To</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {dependenciesList.map((dep, i) => (
                    <tr key={dep.id || i}>
                      <td className="text-muted font-mono" style={{ fontSize: 'var(--text-xs)' }}>{dep.id}</td>
                      <td className="text-sm">{dep.from_entity}</td>
                      <td>
                        <Badge variant={
                          dep.type === 'BLOCKS' ? 'critical'
                          : dep.type === 'REQUIRES' ? 'high'
                          : dep.type === 'WAITING_ON' ? 'medium'
                          : 'neutral'
                        }>{dep.type}</Badge>
                      </td>
                      <td className="text-sm">{dep.to_entity}</td>
                      <td className="text-sm text-muted">{dep.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {decisionsList.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="card-body">
            <div className="section-title" style={{ marginBottom: 'var(--space-3)' }}>Decisions</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Made By</th>
                    <th>Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {decisionsList.map((dec, i) => (
                    <tr key={dec.id || i}>
                      <td className="text-muted font-mono" style={{ fontSize: 'var(--text-xs)' }}>{dec.id}</td>
                      <td><span className="item-title">{dec.description}</span></td>
                      <td>
                        <Badge variant={
                          dec.type === 'COMMITTED' ? 'low'
                          : dec.type === 'DEFERRED' ? 'medium'
                          : dec.type === 'OPEN_QUESTION' ? 'info'
                          : 'neutral'
                        }>{dec.type}</Badge>
                      </td>
                      <td className="text-sm text-muted">{dec.made_by || '--'}</td>
                      <td className="text-sm text-muted">{dec.rationale || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="grid-2">
        {projects.map((project, i) => (
          <ProjectCard key={i} {...project} />
        ))}
      </div>
    </div>
  );
}
