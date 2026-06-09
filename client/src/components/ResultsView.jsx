import { useState } from 'react';
import MeetingHeader from './dashboard/MeetingHeader.jsx';
import TasksSection from './dashboard/TasksSection.jsx';
import EscalationsSection from './dashboard/EscalationsSection.jsx';
import RisksSection from './dashboard/RisksSection.jsx';
import DecisionsSection from './dashboard/DecisionsSection.jsx';
import StakeholdersSection from './dashboard/StakeholdersSection.jsx';
import DependenciesSection from './dashboard/DependenciesSection.jsx';
import JsonViewer from './JsonViewer.jsx';

const TABS = [
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'json',      label: '{ } JSON' },
];

export default function ResultsView({ data }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!data) {
    return (
      <div className="welcome-state">
        <div className="welcome-orb">🧠</div>
        <div className="welcome-title">Paste a transcript to begin</div>
        <div className="welcome-subtitle">
          OrgPulse AI will extract tasks, escalations, risks, decisions,
          stakeholders, and dependencies — ready in seconds.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Tab bar in the results panel header */}
      <div className="results-panel-header">
        <div className="tab-bar" role="tablist" aria-label="Results view">
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
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
        </div>
      </div>

      {/* Panel body */}
      <div className="results-panel-body" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'dashboard' ? (
          <>
            <MeetingHeader meeting={data.meeting} />
            <TasksSection tasks={data.tasks || []} />
            <EscalationsSection escalations={data.escalations || []} />
            <RisksSection risks={data.risks || []} />
            <DecisionsSection decisions={data.decisions || []} />
            <StakeholdersSection stakeholders={data.stakeholders || []} />
            <DependenciesSection dependencies={data.dependencies || []} />
          </>
        ) : (
          <JsonViewer data={data} />
        )}
      </div>
    </>
  );
}
