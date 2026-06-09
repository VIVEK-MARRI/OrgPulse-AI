import { useState, useCallback } from 'react';
import './recurring.css';
import RecurringRiskCard from './RecurringRiskCard.jsx';

const API_BASE = '';

export default function RecurringRisksDashboard({ recurring, recurringStatus }) {
  const [loadedIssues, setLoadedIssues] = useState(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const issues = recurring ?? loadedIssues ?? [];
  const multiOccurrence = issues.filter(c => c.occurrence_count >= 2);
  const criticalAlerts = issues.filter(c => c.occurrence_count >= 3);
  const totalMeetings = new Set(issues.flatMap(c => c.related_items?.map(r => r.meeting_id) || [])).size;

  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res = await fetch(`${API_BASE}/api/recurring`);
      const json = await res.json();
      if (json.success) setLoadedIssues(json.recurringIssues || []);
    } catch (err) {
      console.error('Failed to load recurring issues:', err);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  const resetMemory = useCallback(async () => {
    if (!window.confirm('Clear all organizational memory? This cannot be undone.')) return;
    setResetting(true);
    try {
      await fetch(`${API_BASE}/api/recurring`, { method: 'DELETE' });
      setLoadedIssues([]);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setResetting(false);
    }
  }, []);

  const isLoading = recurringStatus === 'recurring';
  const singleOccurrence = issues.filter(c => c.occurrence_count === 1);

  return (
    <div className="recurring-dashboard">
      <div className="memory-toolbar">
        <div>
          <div className="section-title">Organizational Memory</div>
          <div className="section-count">Recurring risks and escalations detected across meetings.</div>
        </div>
        <div className="flex gap-2">
          <button id="btn-load-recurring" type="button" className="btn btn-secondary btn-sm" onClick={loadAll} disabled={loadingAll || isLoading}>
            {loadingAll ? <><span className="spinner spinner-xs" /> Loading...</> : 'Load Memory'}
          </button>
          <button id="btn-reset-memory" type="button" className="btn btn-ghost btn-sm" onClick={resetMemory} disabled={resetting}>
            {resetting ? 'Clearing...' : 'Reset'}
          </button>
        </div>
      </div>

      {resetDone && <div className="ingest-result"><span>Organizational memory cleared.</span></div>}

      {isLoading && (
        <div className="loading-panel">
          <span className="spinner spinner-sm" />
          <div>
            <div className="item-title">Scanning organizational memory...</div>
            <div className="text-sm text-muted">Embedding issues, searching for patterns, and clustering recurring risks.</div>
          </div>
        </div>
      )}

      {!isLoading && criticalAlerts.length > 0 && (
        <div className="recurring-alert-banner">
          <div>
            <div className="recurring-alert-title">Recurring Organizational Risk Detected</div>
            <div className="recurring-alert-subtitle">
              {criticalAlerts.length === 1
                ? '1 issue has appeared in 3 or more meetings and remains unresolved. Leadership action is recommended.'
                : `${criticalAlerts.length} issues have each appeared in 3 or more meetings and remain unresolved. Leadership action is recommended.`}
            </div>
          </div>
        </div>
      )}

      {!isLoading && issues.length > 0 && (
        <div className="memory-stats">
          <div className="memory-stat"><span className="memory-stat-value">{issues.length}</span><span className="memory-stat-label">Issue Clusters</span></div>
          <div className="memory-stat"><span className="memory-stat-value">{criticalAlerts.length}</span><span className="memory-stat-label">Critical Alerts</span></div>
          <div className="memory-stat"><span className="memory-stat-value">{multiOccurrence.length}</span><span className="memory-stat-label">Recurring Issues</span></div>
          <div className="memory-stat"><span className="memory-stat-value">{totalMeetings}</span><span className="memory-stat-label">Meetings Tracked</span></div>
        </div>
      )}

      {!isLoading && multiOccurrence.length > 0 && (
        <div>
          <div className="eyebrow recurring-section-label">Recurring Issues ({multiOccurrence.length})</div>
          {multiOccurrence.map(cluster => <RecurringRiskCard key={cluster.cluster_id} cluster={cluster} />)}
        </div>
      )}

      {!isLoading && singleOccurrence.length > 0 && (
        <div>
          <div className="eyebrow recurring-section-label">Monitored Issues</div>
          <div className="single-occurrence-list">
            {singleOccurrence.map(cluster => {
              const item = cluster.related_items?.[0];
              return (
                <div key={cluster.cluster_id} className="single-occurrence-card">
                  <span className="status-dot" />
                  <span className="single-occurrence-description">{item?.description || 'Issue'}</span>
                  <span className={`badge ${item?.severity === 'CRITICAL' ? 'badge-critical' : item?.severity === 'HIGH' ? 'badge-high' : 'badge-neutral'}`}>
                    {item?.severity || 'MEDIUM'}
                  </span>
                  <span className="badge badge-neutral">{item?.meeting_title || 'Meeting'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && issues.length === 0 && (
        <div>
          <div className="welcome-state">
            <div className="welcome-mark">OP</div>
            <div className="welcome-title">No organizational memory yet</div>
            <div className="welcome-subtitle">
              Analyze multiple meetings to build a cross-meeting intelligence layer and surface recurring risks.
            </div>
          </div>
          <div className="demo-series-hint">
            <strong>Try the demo series</strong>: load and analyze meetings A, B, and C from Samples to see recurring risk detection.
          </div>
        </div>
      )}
    </div>
  );
}
