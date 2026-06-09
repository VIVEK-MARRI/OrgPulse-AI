import { useState, useRef, useEffect } from 'react';
import { SAMPLE_TRANSCRIPT, SAMPLE_MEETING_TITLE, SAMPLE_REFERENCE_DATE } from '../data/SampleTranscript.js';
import { DEMO_MEETINGS } from '../data/SampleMeetings.js';

export default function TranscriptInput({ onAnalyze, isLoading, status, error, onApiKeyChange }) {
  const [transcript,     setTranscript]     = useState('');
  const [meetingTitle,   setMeetingTitle]   = useState('');
  const [referenceDate,  setReferenceDate]  = useState(() => new Date().toISOString().slice(0, 10));
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [showSettings,   setShowSettings]   = useState(false);
  const [showSamples,    setShowSamples]    = useState(false);

  const settingsRef = useRef(null);
  const samplesRef  = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
      if (samplesRef.current  && !samplesRef.current.contains(e.target))  setShowSamples(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadSample = (id) => {
    if (id === 'phoenix') {
      setTranscript(SAMPLE_TRANSCRIPT);
      setMeetingTitle(SAMPLE_MEETING_TITLE);
      setReferenceDate(SAMPLE_REFERENCE_DATE);
    } else {
      const m = DEMO_MEETINGS.find(d => d.id === id);
      if (m) {
        setTranscript(m.transcript);
        setMeetingTitle(m.title);
        setReferenceDate(m.referenceDate);
      }
    }
    setShowSamples(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    onAnalyze({ transcript, meetingTitle, referenceDate, apiKeyOverride });
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  const statusText =
    status === 'analyzing' ? 'Extracting data…'
    : status === 'briefing'  ? 'Generating brief…'
    : status === 'recurring' ? 'Scanning org memory…'
    : null;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
      {/* ── Panel header ── */}
      <div className="input-panel-header">
        <span className="input-panel-title">📝 Transcript</span>

        <div className="flex gap-2 items-center">
          {/* Settings popover */}
          <div className="settings-popover-wrap" ref={settingsRef}>
            <button type="button" id="btn-settings" className="btn btn-ghost btn-icon"
              onClick={() => setShowSettings(s => !s)} aria-label="Settings" title="API key settings">
              ⚙
            </button>
            {showSettings && (
              <div className="settings-popover" role="dialog" aria-label="Settings">
                <div className="settings-popover-title">⚙ Settings</div>
                <div className="form-group">
                  <label className="form-label" htmlFor="api-key-input">Gemini API Key Override</label>
                  <input
                    id="api-key-input" type="password" className="form-input"
                    placeholder="AIza... (optional, overrides .env)"
                    value={apiKeyOverride}
                    onChange={e => { setApiKeyOverride(e.target.value); onApiKeyChange?.(e.target.value); }}
                    autoComplete="off" spellCheck={false}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Used only for this request. Not stored.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Sample / Demo Series dropdown */}
          <div style={{ position: 'relative' }} ref={samplesRef}>
            <button
              type="button"
              id="btn-load-sample"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSamples(s => !s)}
            >
              ✨ Sample ▾
            </button>

            {showSamples && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                minWidth: 260, zIndex: 100,
                overflow: 'hidden',
              }}>
                {/* Phoenix Platform sample */}
                <button
                  type="button"
                  onClick={() => loadSample('phoenix')}
                  style={{
                    width: '100%', textAlign: 'left', padding: '0.6rem 0.9rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)', fontSize: '0.82rem',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ fontWeight: 600 }}>Phoenix Platform Sync</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>General purpose sample transcript</div>
                </button>

                {/* Demo series divider */}
                <div style={{ padding: '0.35rem 0.9rem 0.2rem', fontSize: '0.62rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)',
                  background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-subtle)',
                }}>
                  🎭 Org Memory Demo Series
                </div>
                <div style={{ padding: '0.25rem 0.9rem 0.3rem', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Analyze A → B → C in sequence to see recurring risk detection
                </div>

                {DEMO_MEETINGS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => loadSample(m.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '0.55rem 0.9rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      borderTop: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)', fontSize: '0.82rem',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(6,182,212,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <div style={{ fontWeight: 600 }}>Meeting {m.id} — {m.title.split('—')[0].trim()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 1 }}>{m.referenceDate}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Panel body ── */}
      <div className="input-panel-body">
        <div className="form-group">
          <label className="form-label" htmlFor="meeting-title">Meeting Title</label>
          <input id="meeting-title" type="text" className="form-input"
            placeholder="e.g. Phoenix Platform Quarterly Sync"
            value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="reference-date">Reference Date</label>
          <input id="reference-date" type="date" className="form-input"
            value={referenceDate} onChange={e => setReferenceDate(e.target.value)} />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <div className="flex justify-between items-center">
            <label className="form-label" htmlFor="transcript-input">Transcript</label>
            {wordCount > 0 && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ~{wordCount.toLocaleString()} words
              </span>
            )}
          </div>
          <textarea
            id="transcript-input"
            className="form-textarea"
            style={{ minHeight: '280px', flex: 1 }}
            placeholder="Paste your meeting transcript here, or click ✨ Sample to load a demo..."
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            required
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-banner-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="input-panel-footer">
        <button
          id="btn-analyze"
          type="submit"
          className="btn btn-primary btn-full"
          disabled={isLoading || !transcript.trim()}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <><span className="spinner" aria-hidden="true" /> {statusText || 'Analyzing…'}</>
          ) : (
            <>🧠 Analyze Meeting</>
          )}
        </button>
      </div>
    </form>
  );
}
