import { useState, useMemo } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { severityClass } from '../utils/severity.js';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

function loadData() {
  try {
    const stored = localStorage.getItem('orgpulse_last_analysis');
    if (stored) return JSON.parse(stored).extraction || null;
    } catch { /* no stored data */ }
    return null;
}

export default function RisksEscalations() {
  const [extraction] = useState(loadData);
  const [riskFilter, setRiskFilter] = useState('all');
  const [escFilter, setEscFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredRisks = useMemo(() => {
    const items = extraction?.risks || [];
    let result = items;
    if (riskFilter !== 'all') result = result.filter(r => r.severity === riskFilter.toUpperCase());
    if (search) result = result.filter(r => r.description?.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [extraction, riskFilter, search]);

  const filteredEscalations = useMemo(() => {
    const items = extraction?.escalations || [];
    let result = items;
    if (escFilter !== 'all') result = result.filter(e => e.severity === escFilter.toUpperCase());
    if (search) result = result.filter(e => e.description?.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [extraction, escFilter, search]);

  if (!extraction) {
    return (
      <div>
        <PageHeader title="Risks & Escalations" description="Enterprise risk center" />
        <EmptyState
          title="No risk data available"
          description="Analyze a meeting transcript to surface risks and escalations."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Risks & Escalations"
        description="Enterprise risk center"
      />

      <div className="risks-filters">
        <input
          type="text"
          className="form-input"
          placeholder="Search risks and escalations..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" value={riskFilter} onChange={e => setRiskFilter(e.target.value)}>
          <option value="all">All Risks</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="form-input" value={escFilter} onChange={e => setEscFilter(e.target.value)}>
          <option value="all">All Escalations</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <Card>
          <CardBody style={{ padding: 0 }}>
            <div className="section-header">
              <div className="section-icon" />
              <div className="section-title-group">
                <div className="section-title">Risks</div>
                <div className="section-count">{filteredRisks.length}</div>
              </div>
            </div>
            {filteredRisks.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>No risks match the current filters.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Severity</th>
                      <th>Probability</th>
                      <th>Impact</th>
                      <th>Trigger</th>
                      <th>Mitigation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRisks.map((risk, i) => (
                      <tr key={risk.id || i}>
                        <td className="text-muted font-mono" style={{ fontSize: 'var(--text-xs)' }}>{risk.id}</td>
                        <td><span className="item-title">{risk.description}</span></td>
                        <td><Badge variant={severityClass(risk.severity)}>{risk.severity}</Badge></td>
                        <td className="text-muted">{risk.probability}</td>
                        <td className="text-muted">{risk.impact_area || '--'}</td>
                        <td className="text-sm text-muted">{risk.trigger || '--'}</td>
                        <td className="text-sm text-muted">{risk.mitigation || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody style={{ padding: 0 }}>
            <div className="section-header">
              <div className="section-icon" />
              <div className="section-title-group">
                <div className="section-title">Escalations</div>
                <div className="section-count">{filteredEscalations.length}</div>
              </div>
            </div>
            {filteredEscalations.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>No escalations match the current filters.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Description</th>
                      <th>Severity</th>
                      <th>Blocker</th>
                      <th>Raised By</th>
                      <th>Escalated To</th>
                      <th>Project</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEscalations.map((esc, i) => (
                      <tr key={esc.id || i}>
                        <td className="text-muted font-mono" style={{ fontSize: 'var(--text-xs)' }}>{esc.id}</td>
                        <td><span className="item-title">{esc.description}</span></td>
                        <td><Badge variant={severityClass(esc.severity)}>{esc.severity}</Badge></td>
                        <td>{esc.is_blocker ? <Badge variant="critical">Blocker</Badge> : <span className="text-muted">--</span>}</td>
                        <td className="text-sm text-muted">{esc.raised_by || '--'}</td>
                        <td className="text-sm text-muted">{esc.escalated_to || '--'}</td>
                        <td className="text-sm text-muted">{esc.project || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
