import { useState } from 'react';
import { useAnalyze } from './hooks/useAnalyze.js';
import TranscriptInput from './components/TranscriptInput.jsx';
import ResultsView from './components/ResultsView.jsx';

export default function App() {
  const { analyze, extraction, brief, recurring, status, error } = useAnalyze();
  const [apiKeyOverride, setApiKeyOverride] = useState('');

  const isLoading = ['analyzing', 'briefing', 'recurring'].includes(status);

  const statusLabel =
    status === 'analyzing' ? 'Extracting data…'
    : status === 'briefing'  ? 'Generating brief…'
    : status === 'recurring' ? 'Scanning org memory…'
    : status === 'success'   ? 'Analysis complete'
    : null;

  return (
    <div className="app-wrapper">
      {/* ── Header ── */}
      <header className="app-header" role="banner">
        <div className="app-logo">
          <div className="app-logo-icon" aria-hidden="true">🧠</div>
          <span className="app-logo-text">OrgPulse AI</span>
          <span className="app-logo-badge">Beta</span>
        </div>

        <div className="flex items-center gap-3">
          {statusLabel && (
            <span style={{
              fontSize: '0.78rem',
              color: status === 'success' ? 'var(--color-low)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}>
              {status === 'success'
                ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-low)', display: 'inline-block' }} />
                : <span className="spinner" style={{ width: 13, height: 13 }} />}
              {statusLabel}
            </span>
          )}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.78rem' }}
          >
            Get API Key ↗
          </a>
        </div>
      </header>

      {/* ── Main layout ── */}
      <main className="app-main" role="main">
        <section className="input-panel" aria-label="Transcript input">
          <TranscriptInput
            onAnalyze={analyze}
            isLoading={isLoading}
            status={status}
            error={error}
            onApiKeyChange={setApiKeyOverride}
          />
        </section>

        <section className="results-panel" aria-label="Analysis results">
          <ResultsView
            data={extraction}
            brief={brief}
            briefStatus={status}
            recurring={recurring}
            recurringStatus={status}
            apiKeyOverride={apiKeyOverride}
          />
        </section>
      </main>
    </div>
  );
}
