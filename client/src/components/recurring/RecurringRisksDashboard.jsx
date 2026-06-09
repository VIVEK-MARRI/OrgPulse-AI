import { useState, useCallback } from 'react';
import './recurring.css';
import RecurringRiskCard from './RecurringRiskCard.jsx';

const API_BASE = '';

export default function RecurringRisksDashboard({ recurring, recurringStatus }) {
  const [loadedIssues, setLoadedIssues]   = useState(null);
  const [loadingAll, setLoadingAll]       = useState(false);
  const [resetting, setResetting]         = useState(false);
  const [resetDone, setResetDone]         = useState(false);

  // Use prop data if available, otherwise use locally-loaded data
  const issues = recurring ?? loadedIssues ?? [];

  const multiOccurrence = issues.filter(c => c.occurrence_count >= 2);
  const criticalAlerts  = issues.filter(c => c.occurrence_count >= 3);
  const totalMeetings   = new Set(
    issues.flatMap(c => c.related_items?.map(r => r.meeting_id) || [])
  ).size;

  // Load all stored recurring issues from server
  const loadAll = useCallback(async () => {
    setLoadingAll(true);
    try {
      const res  = await fetch(`${API_BASE}/api/recurring`);
      const json = await res.json();
      if (json.success) setLoadedIssues(json.recurringIssues || []);
    } catch (err) {
      console.error('Failed to load recurring issues:', err);
    } finally {
      setLoadingAll(false);
    }
  }, []);

  // Clear all organizational memory
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

  return (
    <div className="recurring-dashboard">

      {/* ── Top control bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            🧠 Organizational Memory
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            Recurring risks &amp; escalations detected across multiple meetings
          </div>
        </div>
        <div className="flex gap-2">
          <button
            id="btn-load-recurring"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={loadAll}
            disabled={loadingAll || isLoading}
          >
            {loadingAll ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Loading…</> : '↻ Load Memory'}
          </button>
          <button
            id="btn-reset-memory"
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={resetMemory}
            disabled={resetting}
            style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}
          >
            {resetting ? 'Clearing…' : '🗑 Reset'}
          </button>
        </div>
      </div>

      {resetDone && (
        <div className="ingest-result">✓ <span>Organizational memory cleared.</span></div>
      )}

      {/* ── Loading state ── */}
      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'rgba(124,58,237,0.06)', border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-md)' }}>
          <span className="spinner" style={{ width: 16, height: 16 }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Scanning organizational memory…</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>Embedding issues, searching for patterns, clustering recurring risks.</div>
          </div>
        </div>
      )}

      {/* ── 🚨 Critical Alert Banner (occurrence_count >= 3) ── */}
      {!isLoading && criticalAlerts.length > 0 && (
        <div className="recurring-alert-banner">
          <span className="recurring-alert-icon">🚨</span>
          <div>
            <div className="recurring-alert-title">
              Recurring Organizational Risk Detected
            </div>
            <div className="recurring-alert-subtitle">
              {criticalAlerts.length === 1
                ? `1 issue has appeared in 3 or more meetings and remains unresolved. Immediate leadership action required.`
                : `${criticalAlerts.length} issues have each appeared in 3 or more meetings and remain unresolved. Immediate leadership action required.`}
            </div>
          </div>
        </div>
      )}

      {/* ── Memory stats ── */}
      {!isLoading && issues.length > 0 && (
        <div className="memory-stats">
          <div className="memory-stat">
            <span className="memory-stat-value">{issues.length}</span>
            <span className="memory-stat-label">Issue Clusters</span>
          </div>
          <div className="memory-stat">
            <span className="memory-stat-value" style={{ color: criticalAlerts.length > 0 ? 'var(--color-critical)' : 'var(--text-accent)' }}>
              {criticalAlerts.length}
            </span>
            <span className="memory-stat-label">Critical Alerts</span>
          </div>
          <div className="memory-stat">
            <span className="memory-stat-value">{multiOccurrence.length}</span>
            <span className="memory-stat-label">Recurring Issues</span>
          </div>
          <div className="memory-stat">
            <span className="memory-stat-value">{totalMeetings}</span>
            <span className="memory-stat-label">Meetings Tracked</span>
          </div>
        </div>
      )}

      {/* ── Recurring issues (occurrence >= 2, AI-analyzed) ── */}
      {!isLoading && multiOccurrence.length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Recurring Issues ({multiOccurrence.length})
          </div>
          {multiOccurrence.map(cluster => (
            <div key={cluster.cluster_id} style={{ marginBottom: '1rem' }}>
              <RecurringRiskCard cluster={cluster} />
            </div>
          ))}
        </div>
      )}

      {/* ── Single-occurrence items (just seen once, no AI analysis yet) ── */}
      {!isLoading && issues.filter(c => c.occurrence_count === 1).length > 0 && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Monitored Issues (seen once — watching for recurrence)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {issues.filter(c => c.occurrence_count === 1).map(cluster => {
              const item = cluster.related_items?.[0];
              return (
                <div key={cluster.cluster_id} className="single-occurrence-card">
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', flex: 1 }}>
                    {item?.description || 'Issue'}
                  </span>
                  <span className={`badge ${item?.severity === 'CRITICAL' ? 'badge-critical' : item?.severity === 'HIGH' ? 'badge-high' : 'badge-neutral'}`} style={{ fontSize: '0.62rem' }}>
                    {item?.severity || 'MEDIUM'}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.62rem' }}>
                    {item?.meeting_title || 'Meeting'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Demo hint (shown when no data yet) ── */}
      {!isLoading && issues.length === 0 && (
        <div>
          <div className="welcome-state" style={{ paddingTop: '0.5rem' }}>
            <div className="welcome-orb" style={{ fontSize: '1.5rem' }}>🧠</div>
            <div className="welcome-title">No organizational memory yet</div>
            <div className="welcome-subtitle">
              Analyze multiple meetings to build a cross-meeting intelligence layer.
              OrgPulse will detect recurring risks, cluster them, and surface leadership alerts.
            </div>
          </div>
          <div className="demo-series-hint" style={{ marginTop: '1rem' }}>
            <strong>🎭 Try the Demo Series</strong> — Load and analyze these three meetings in sequence using the ✨ Sample dropdown to see organizational memory in action:
            <ol className="demo-series-steps">
              <li><strong>Meeting A (May 20)</strong> — Payment Integration Sprint Review: "Vendor API instability delaying Payment Integration."</li>
              <li><strong>Meeting B (May 27)</strong> — Status Check: "Vendor API issue still unresolved. Backend blocked."</li>
              <li><strong>Meeting C (June 3)</strong> — Emergency Review: "Payment Integration delayed due to Vendor API reliability."</li>
            </ol>
            After all three, the system will cluster the Vendor API issue as a <strong>Critical Recurring Organizational Risk</strong> and generate a leadership brief.
          </div>
        </div>
      )}
    </div>
  );
}
