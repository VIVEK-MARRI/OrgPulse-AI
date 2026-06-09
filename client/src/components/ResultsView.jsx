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

const TABS = [
  { id: 'brief',     label: '⚡ Brief',     requiresBrief: true  },
  { id: 'dashboard', label: '📊 Dashboard', requiresBrief: false },
  { id: 'graph',     label: '🔍 Graph',     requiresBrief: false },
  { id: 'json',      label: '{ } JSON',     requiresBrief: false },
];

export default function ResultsView({ data, brief, briefStatus, apiKeyOverride }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Auto-switch to Brief tab when it first arrives
  const [briefSeen, setBriefSeen] = useState(false);
  if (brief && !briefSeen) {
    setBriefSeen(true);
    setActiveTab('brief');
  }

  if (!data) {
    return (
      <div className="welcome-state">
        <div className="welcome-orb">🧠</div>
        <div className="welcome-title">Paste a transcript to begin</div>
        <div className="welcome-subtitle">
          OrgPulse AI will extract tasks, escalations, risks, decisions,
          stakeholders, and dependencies — then synthesize an executive briefing
          and generate a queryable knowledge graph.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Tab bar ── */}
      <div className="results-panel-header">
        <div className="tab-bar" role="tablist" aria-label="Results view">
          {TABS.map(tab => {
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
                {isBriefLoading && (
                  <span className="spinner" style={{ width: 12, height: 12 }} />
                )}
                {tab.id === 'brief' && brief && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-low)', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Summary counts */}
        <div className="flex gap-2 flex-wrap" style={{ flexShrink: 0 }}>
          {data.tasks?.length > 0 && (
            <span className="badge badge-violet">✅ {data.tasks.length} tasks</span>
          )}
          {data.escalations?.length > 0 && (
            <span className="badge badge-critical">🚨 {data.escalations.length} escalations</span>
          )}
          {data.risks?.length > 0 && (
            <span className="badge badge-high">⚠️ {data.risks.length} risks</span>
          )}
          {brief && (
            <span className={`badge ${
              brief.org_health === 'CRITICAL' ? 'badge-critical'
              : brief.org_health === 'WARNING' ? 'badge-medium'
              : 'badge-low'
            }`}>
              🏥 {brief.org_health} ({brief.health_score})
            </span>
          )}
        </div>
      </div>

      {/* ── Panel body ── */}
      <div className="results-panel-body" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>

        {/* ── Executive Brief ── */}
        {activeTab === 'brief' && (
          brief
            ? <ExecutiveBrief brief={brief} />
            : (
              <div className="welcome-state">
                <div className="welcome-orb" style={{ fontSize: '1.5rem' }}>
                  {briefStatus === 'briefing'
                    ? <span className="spinner" style={{ width: 32, height: 32 }} />
                    : '⚡'}
                </div>
                <div className="welcome-title">
                  {briefStatus === 'briefing' ? 'Generating executive brief…' : 'Executive brief unavailable'}
                </div>
                <div className="welcome-subtitle">
                  {briefStatus === 'briefing'
                    ? 'Synthesizing org health, risks, and recommended actions.'
                    : 'Switch to the Dashboard tab to view raw analysis results.'}
                </div>
              </div>
            )
        )}

        {/* ── Dashboard ── */}
        {activeTab === 'dashboard' && (
          <>
            <MeetingHeader meeting={data.meeting} />
            <TasksSection tasks={data.tasks || []} />
            <EscalationsSection escalations={data.escalations || []} />
            <RisksSection risks={data.risks || []} />
            <DecisionsSection decisions={data.decisions || []} />
            <StakeholdersSection stakeholders={data.stakeholders || []} />
            <DependenciesSection dependencies={data.dependencies || []} />
          </>
        )}

        {/* ── Graph Query ── */}
        {activeTab === 'graph' && (
          <GraphQueryPanel
            extraction={data}
            apiKeyOverride={apiKeyOverride}
          />
        )}

        {/* ── JSON ── */}
        {activeTab === 'json' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <JsonViewer data={data} />
            {brief && (
              <>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', paddingTop: '0.5rem' }}>
                  ⚡ Executive Brief JSON
                </div>
                <JsonViewer data={brief} />
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
