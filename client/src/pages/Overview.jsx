import { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { severityClass } from '../utils/severity.js';
import { SkeletonLoader } from '../components/ui/SkeletonLoader.jsx';
import { Card, CardHeader, CardTitle, CardBody } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export default function Overview() {
  const { extraction, brief } = useAnalyzeFromMemory();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <SkeletonLoader rows={6} />;

  const hasData = extraction || brief;

  if (!hasData) {
    return (
      <div>
        <PageHeader
          title="Overview"
          description="Organizational health at a glance"
        />
        <EmptyState
          title="No analysis data available"
          description="Go to Meetings to analyze a transcript and see organizational insights here."
        />
      </div>
    );
  }

  const tasks = extraction?.tasks || [];
  const escalations = extraction?.escalations || [];
  const risks = extraction?.risks || [];
  const healthScore = brief?.health_score ?? null;
  const orgHealth = brief?.org_health ?? null;
  const recurringCount = Array.isArray(brief?.recurring_issues) ? brief.recurring_issues.length : 0;

  const criticalRisks = risks.filter(r => r.severity === 'CRITICAL' || r.severity === 'HIGH');
  const openEscalations = escalations.filter(e => e.status !== 'RESOLVED');
  const pendingTasks = tasks.filter(t => t.status !== 'DONE' && t.status !== 'COMPLETED');

  const projectsAtRisk = (brief?.critical_projects || []).length;

  return (
    <div>
      <PageHeader title="Overview" description="Organizational health at a glance" />

      <div className="kpi-row">
        <StatCard
          label="Org Health Score"
          value={healthScore !== null ? `${healthScore}/100` : '--'}
          change={orgHealth || null}
          changeType={orgHealth === 'CRITICAL' ? 'negative' : orgHealth === 'WARNING' ? 'neutral' : 'positive'}
        />
        <StatCard
          label="Critical Risks"
          value={criticalRisks.length}
          change={`${risks.length} total risks`}
          changeType={criticalRisks.length > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          label="Open Escalations"
          value={openEscalations.length}
          change={`${escalations.length} total`}
          changeType={openEscalations.length > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          label="Pending Tasks"
          value={pendingTasks.length}
          change={`${tasks.length} total tasks`}
          changeType="neutral"
        />
        <StatCard
          label="Projects At Risk"
          value={projectsAtRisk}
          change={brief?.critical_projects?.length ? 'requires attention' : 'no issues'}
          changeType={projectsAtRisk > 0 ? 'negative' : 'positive'}
        />
        <StatCard
          label="Recurring Issues"
          value={recurringCount}
          change={recurringCount > 0 ? 'detected across meetings' : 'none detected'}
          changeType={recurringCount > 0 ? 'negative' : 'positive'}
        />
      </div>

      {(risks.length > 0 || escalations.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {risks.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top Risks</CardTitle></CardHeader>
              <CardBody>
                {risks.slice(0, 5).map((risk, i) => (
                  <div key={risk.id || i} className="brief-list-item" style={{ padding: '8px 0' }}>
                    <Badge variant={severityClass(risk.severity)}>{risk.severity}</Badge>
                    <div className="brief-list-content">
                      <div className="item-title">{risk.description}</div>
                      {risk.impact_area && <div className="text-sm text-muted">{risk.impact_area}</div>}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
          {escalations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Escalations</CardTitle></CardHeader>
              <CardBody>
                {escalations.slice(0, 5).map((esc, i) => (
                  <div key={esc.id || i} className="brief-list-item" style={{ padding: '8px 0' }}>
                    <Badge variant={severityClass(esc.severity)}>{esc.severity}</Badge>
                    <div className="brief-list-content">
                      <div className="item-title">{esc.description}</div>
                      {esc.escalated_to && <div className="text-sm text-muted">Escalated to: {esc.escalated_to}</div>}
                    </div>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {brief?.leadership_summary && (
        <Card>
          <CardHeader><CardTitle>Leadership Summary</CardTitle></CardHeader>
          <CardBody>
            <p className="text-sm text-secondary" style={{ lineHeight: 1.7 }}>{brief.leadership_summary}</p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function useAnalyzeFromMemory() {
  const [state] = useState(() => {
    try {
      const stored = localStorage.getItem('orgpulse_last_analysis');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          extraction: parsed.extraction || null,
          brief: parsed.brief || null,
        };
      }
    } catch { /* no stored data */ }
    return { extraction: null, brief: null };
  });

  return state;
}
