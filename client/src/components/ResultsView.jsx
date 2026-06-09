import { useState } from 'react';
import MeetingHeader from './dashboard/MeetingHeader.jsx';
import TasksSection from './dashboard/TasksSection.jsx';
import EscalationsSection from './dashboard/EscalationsSection.jsx';
import RisksSection from './dashboard/RisksSection.jsx';
import DecisionsSection from './dashboard/DecisionsSection.jsx';
import StakeholdersSection from './dashboard/StakeholdersSection.jsx';
import DependenciesSection from './dashboard/DependenciesSection.jsx';
import JsonViewer from './JsonViewer.jsx';
import ExecutiveBrief from './brief/ExecutiveBrief.jsx';
import GraphQueryPanel from './graph/GraphQueryPanel.jsx';
import RecurringRisksDashboard from './recurring/RecurringRisksDashboard.jsx';

const TABS = [
  { id: 'brief',     label: '⚡ Brief'     },
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'memory',    label: '🧠 Memory'    },
  { id: 'graph',     label: '🔍 Graph'     },
  { id: 'json',      label: '{ } JSON'    },
];

export default function ResultsView({
  data, brief, briefStatus, recurring, recurringStatus, apiKeyOverride,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auto-switch to Brief when it first arrives
  const [briefSeen, setBriefSeen] = useState(false);
  if (brief && !briefSeen) { setBriefSeen(true); setActiveTab('brief'); }

  // Auto-switch to Memory when critical recurring issues arrive
  const [memorySeen, setMemorySeen] = useState(false);
  const hasCritical = (recurring || []).some(c => c.occurrence_count >= 3);
  if (hasCritical && !memorySeen) { setMemorySeen(true); setActiveTab('memory'); }

  if (!data) {
    return (
      <div className="welcome-state">
        <div className="welcome-orb">🧠</div>
        <div className="welcome-title">Paste a transcript to begin</div>
        <div className="welcome-subtitle">
          OrgPulse AI extracts tasks, escalations, risks, decisions and stakeholders —
          synthesizes an executive brief, detects recurring organizational risks across
          meetings, and builds a queryable knowledge graph.
        </div>
      </div>
    );
  }

  const recurringAlert = (recurring || []).filter(c => c.occurrence_count >= 3).length;

  return (
    <>
      {/* ── Tab bar ── */}
      <div className="results-panel-header">
        <div className="tab-bar" role="tablist" aria-label="Results tabs">
          {TABS.map(tab => {
            const isRecurringLoading = tab.id === 'memory' && recurringStatus === 'recurring';
            const showAlert = tab.id === 'memory' && recurringAlert > 0 && recurringStatus === 'success';
            const isBriefLoading = tab.id === 'brief' && briefStatus === 'briefing';
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {isBriefLoading && <span className="spinner" style={{ width: 11, height: 11 }} />}
                {isRecurringLoading && <span className="spinner" style={{ width: 11, height: 11 }} />}
                {showAlert && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--color-critical)', flexShrink: 0,
                    animation: 'pulse-border 1.5s ease-in-out infinite',
                  }} />
                )}
                {tab.id === 'brief' && brief && !isBriefLoading && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-low)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap" style={{ flexShrink: 0 }}>
          {recurringAlert > 0 && (
            <span className="badge badge-critical" style={{ animation: 'pulse-border 2s ease-in-out infinite' }}>
              🔁 {recurringAlert} recurring
            </span>
          )}
          {data.tasks?.length > 0 && (
            <span className="badge badge-violet">✅ {data.tasks.length} tasks</span>
          )}
          {data.escalations?.length > 0 && (
            <span className="badge badge-critical">🚨 {data.escalations.length} escalations</span>
          )}
          {brief && (
            <span className={`badge ${
              brief.org_health === 'CRITICAL' ? 'badge-critical'
              : brief.org_health === 'WARNING' ? 'badge-medium'
              : 'badge-low'
            }`}>
              🏥 {brief.org_health}
            </span>
          )}
        </div>
      </div>

      {/* ── Tab panels ── */}
      <div className="results-panel-body" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>

        {/* ⚡ Brief */}
        {activeTab === 'brief' && (
          brief
            ? <ExecutiveBrief brief={brief} />
            : (
              <div className="welcome-state">
                <div className="welcome-orb" style={{ fontSize: '1.5rem' }}>
                  {briefStatus === 'briefing' || briefStatus === 'recurring'
                    ? <span className="spinner" style={{ width: 32, height: 32 }} />
                    : '⚡'}
                </div>
                <div className="welcome-title">
                  {(briefStatus === 'briefing' || briefStatus === 'recurring')
                    ? 'Generating executive brief…'
                    : 'Executive brief unavailable'}
                </div>
              </div>
            )
        )}

        {/* 📊 Dashboard */}
        {activeTab === 'dashboard' && (
          <>
            <MeetingHeader    meeting={data.meeting} />
            <TasksSection     tasks={data.tasks || []} />
            <EscalationsSection escalations={data.escalations || []} />
            <RisksSection     risks={data.risks || []} />
            <DecisionsSection decisions={data.decisions || []} />
            <StakeholdersSection stakeholders={data.stakeholders || []} />
            <DependenciesSection dependencies={data.dependencies || []} />
          </>
        )}

        {/* 🧠 Memory */}
        {activeTab === 'memory' && (
          <RecurringRisksDashboard
            recurring={recurring}
            recurringStatus={recurringStatus}
          />
        )}

        {/* 🔍 Graph */}
        {activeTab === 'graph' && (
          <GraphQueryPanel
            extraction={data}
            apiKeyOverride={apiKeyOverride}
          />
        )}

        {/* { } JSON */}
        {activeTab === 'json' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <JsonViewer data={data} />
            {brief && (
              <>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                  ⚡ Executive Brief JSON
                </div>
                <JsonViewer data={brief} />
              </>
            )}
            {recurring?.length > 0 && (
              <>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                  🧠 Recurring Issues JSON
                </div>
                <JsonViewer data={recurring} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
