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
  { id: 'brief', label: 'Executive Brief' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'memory', label: 'Memory' },
  { id: 'graph', label: 'Graph' },
  { id: 'json', label: 'JSON' },
];

export default function ResultsView({
  data, brief, briefStatus, recurring, recurringStatus, apiKeyOverride,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [briefSeen, setBriefSeen] = useState(false);
  const [memorySeen, setMemorySeen] = useState(false);

  if (brief && !briefSeen) {
    setBriefSeen(true);
    setActiveTab('brief');
  }

  const hasCritical = (recurring || []).some(c => c.occurrence_count >= 3);
  if (hasCritical && !memorySeen) {
    setMemorySeen(true);
    setActiveTab('memory');
  }

  if (!data) {
    return (
      <div className="welcome-state">
        <div className="welcome-mark">OP</div>
        <div className="welcome-title">Paste a transcript to begin</div>
        <div className="welcome-subtitle">
          OrgPulse extracts actions, risks, escalations, decisions, stakeholders,
          organizational memory, and graph-ready intelligence from meeting transcripts.
        </div>
      </div>
    );
  }

  const recurringAlert = (recurring || []).filter(c => c.occurrence_count >= 3).length;

  return (
    <>
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
                {(isBriefLoading || isRecurringLoading) && <span className="spinner spinner-xs" />}
                {showAlert && <span className="status-dot status-dot-danger" />}
                {tab.id === 'brief' && brief && !isBriefLoading && <span className="status-dot status-dot-success" />}
              </button>
            );
          })}
        </div>

        <div className="summary-badges">
          {recurringAlert > 0 && (
            <span className="badge badge-critical">{recurringAlert} recurring</span>
          )}
          {data.tasks?.length > 0 && (
            <span className="badge badge-info">{data.tasks.length} tasks</span>
          )}
          {data.escalations?.length > 0 && (
            <span className="badge badge-critical">{data.escalations.length} escalations</span>
          )}
          {brief && (
            <span className={`badge ${
              brief.org_health === 'CRITICAL' ? 'badge-critical'
              : brief.org_health === 'WARNING' ? 'badge-medium'
              : 'badge-low'
            }`}>
              {brief.org_health}
            </span>
          )}
        </div>
      </div>

      <div className="results-panel-body" role="tabpanel" aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'brief' && (
          brief
            ? <ExecutiveBrief brief={brief} />
            : (
              <div className="welcome-state">
                <div className="welcome-mark">
                  {briefStatus === 'briefing' || briefStatus === 'recurring'
                    ? <span className="spinner" />
                    : 'OP'}
                </div>
                <div className="welcome-title">
                  {(briefStatus === 'briefing' || briefStatus === 'recurring')
                    ? 'Generating executive brief...'
                    : 'Executive brief unavailable'}
                </div>
              </div>
            )
        )}

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

        {activeTab === 'memory' && (
          <RecurringRisksDashboard
            recurring={recurring}
            recurringStatus={recurringStatus}
          />
        )}

        {activeTab === 'graph' && (
          <GraphQueryPanel
            extraction={data}
            apiKeyOverride={apiKeyOverride}
          />
        )}

        {activeTab === 'json' && (
          <div className="json-stack">
            <div className="developer-view-heading">
              <span>Developer Output</span>
              <p>Structured payloads returned by the analysis pipeline.</p>
            </div>
            <JsonViewer data={data} label="Extraction JSON" />
            {brief && <JsonViewer data={brief} label="Executive Brief JSON" />}
            {recurring?.length > 0 && <JsonViewer data={recurring} label="Recurring Issues JSON" />}
          </div>
        )}
      </div>
    </>
  );
}
