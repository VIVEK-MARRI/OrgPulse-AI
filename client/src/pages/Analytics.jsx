import { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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

const COLORS = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e', info: '#5b8def', muted: '#71717a' };

export default function Analytics() {
  const [{ extraction, brief }] = useState(loadData);

  if (!extraction) {
    return (
      <div>
        <PageHeader title="Analytics" description="Charts and metrics" />
        <EmptyState
          title="No analytics data available"
          description="Analyze a meeting transcript to generate analytics."
        />
      </div>
    );
  }

  const tasks = extraction.tasks || [];
  const escalations = extraction.escalations || [];
  const risks = extraction.risks || [];
  const decisions = extraction.decisions || [];
  const stakeholders = extraction.stakeholders || [];

  const severityCount = (items, key = 'severity') => {
    const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    items.forEach(i => { const s = (i[key] || '').toUpperCase(); if (counts[s] !== undefined) counts[s]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const riskBySeverity = severityCount(risks);
  const escBySeverity = severityCount(escalations);

  const workloadByOwner = {};
  tasks.forEach(t => {
    const owner = t.owner || 'Unassigned';
    if (!workloadByOwner[owner]) workloadByOwner[owner] = 0;
    workloadByOwner[owner]++;
  });
  const workloadData = Object.entries(workloadByOwner)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const decisionData = (() => {
    const counts = { COMMITTED: 0, DEFERRED: 0, OPEN_QUESTION: 0 };
    decisions.forEach(d => { const t = (d.type || '').toUpperCase(); if (counts[t] !== undefined) counts[t]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  const projectData = brief?.critical_projects?.map(p => ({
    name: p.name,
    score: p.project_health_score || 0,
    health: p.health || 'WARNING',
  })) || [];

  return (
    <div>
      <PageHeader title="Analytics" description="Charts and metrics" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        <div className="chart-panel">
          <div className="chart-panel-title">Risk Distribution by Severity</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {riskBySeverity.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name.toLowerCase()] || COLORS.muted} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-panel">
          <div className="chart-panel-title">Escalation Distribution by Severity</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={escBySeverity} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {escBySeverity.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.name.toLowerCase()] || COLORS.muted} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
        {workloadData.length > 0 && (
          <div className="chart-panel">
            <div className="chart-panel-title">Workload Distribution</div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#5b8def" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {decisionData.some(d => d.value > 0) && (
          <div className="chart-panel">
            <div className="chart-panel-title">Decision Breakdown</div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={decisionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    <Cell fill="#22c55e" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#5b8def" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {projectData.length > 0 && (
        <div className="chart-panel" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="chart-panel-title">Project Health Distribution</div>
          <div className="chart-container" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#71717a', fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="score" radius={[0, 3, 3, 0]}>
                  {projectData.map((entry, i) => (
                    <Cell key={i} fill={COLORS[entry.health.toLowerCase()] || COLORS.muted} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {stakeholders.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Stakeholders</CardTitle></CardHeader>
          <CardBody style={{ padding: 0 }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Team</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {stakeholders.map((s, i) => (
                    <tr key={i}>
                      <td><span className="item-title">{s.name}</span></td>
                      <td className="text-muted">{s.team || '--'}</td>
                      <td className="text-muted">{s.role_in_meeting || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
