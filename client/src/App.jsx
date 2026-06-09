import { useAnalyze } from './hooks/useAnalyze.js';
import TranscriptInput from './components/TranscriptInput.jsx';
import ResultsView from './components/ResultsView.jsx';

export default function App() {
  const { analyze, result, status, error } = useAnalyze();

  const isLoading = status === 'loading';

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
          {status === 'success' && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-low)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-low)', display: 'inline-block' }} />
              Analysis complete
            </span>
          )}
          {isLoading && (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="spinner" style={{ width: 13, height: 13 }} />
              Processing…
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
        {/* Left: Transcript input */}
        <section className="input-panel" aria-label="Transcript input">
          <TranscriptInput
            onAnalyze={analyze}
            isLoading={isLoading}
            error={error}
          />
        </section>

        {/* Right: Results */}
        <section className="results-panel" aria-label="Analysis results">
          <ResultsView data={result} />
        </section>
      </main>
    </div>
  );
}
