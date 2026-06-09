import { useState, useRef, useEffect } from 'react';
import { SAMPLE_TRANSCRIPT, SAMPLE_MEETING_TITLE, SAMPLE_REFERENCE_DATE } from '../data/SampleTranscript.js';

export default function TranscriptInput({ onAnalyze, isLoading, error }) {
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [referenceDate, setReferenceDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef(null);

  // Close settings popover on outside click
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLoadSample = () => {
    setTranscript(SAMPLE_TRANSCRIPT);
    setMeetingTitle(SAMPLE_MEETING_TITLE);
    setReferenceDate(SAMPLE_REFERENCE_DATE);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    onAnalyze({ transcript, meetingTitle, referenceDate, apiKeyOverride });
  };

  const wordCount = transcript.trim()
    ? transcript.trim().split(/\s+/).length
    : 0;

  return (
    <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
      {/* Panel header */}
      <div className="input-panel-header">
        <span className="input-panel-title">📝 Transcript</span>

        <div className="flex gap-2 items-center">
          {/* Settings popover */}
          <div className="settings-popover-wrap" ref={settingsRef}>
            <button
              type="button"
              id="btn-settings"
              className="btn btn-ghost btn-icon"
              onClick={() => setShowSettings(s => !s)}
              aria-label="Settings"
              title="API key settings"
            >
              ⚙
            </button>

            {showSettings && (
              <div className="settings-popover" role="dialog" aria-label="Settings">
                <div className="settings-popover-title">⚙ Settings</div>
                <div className="form-group">
                  <label className="form-label" htmlFor="api-key-input">
                    Gemini API Key Override
                  </label>
                  <input
                    id="api-key-input"
                    type="password"
                    className="form-input"
                    placeholder="AIza... (optional, overrides .env)"
                    value={apiKeyOverride}
                    onChange={e => setApiKeyOverride(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Used only for this request. Not stored anywhere.
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-load-sample"
            className="btn btn-secondary btn-sm"
            onClick={handleLoadSample}
            title="Load a sample transcript"
          >
            ✨ Sample
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="input-panel-body">
        {/* Meeting Title */}
        <div className="form-group">
          <label className="form-label" htmlFor="meeting-title">Meeting Title</label>
          <input
            id="meeting-title"
            type="text"
            className="form-input"
            placeholder="e.g. Phoenix Platform Quarterly Sync"
            value={meetingTitle}
            onChange={e => setMeetingTitle(e.target.value)}
          />
        </div>

        {/* Reference Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="reference-date">Reference Date</label>
          <input
            id="reference-date"
            type="date"
            className="form-input"
            value={referenceDate}
            onChange={e => setReferenceDate(e.target.value)}
          />
        </div>

        {/* Transcript textarea */}
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

        {/* Error display */}
        {error && (
          <div className="error-banner" role="alert">
            <span className="error-banner-icon">⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Panel footer — submit button */}
      <div className="input-panel-footer">
        <button
          id="btn-analyze"
          type="submit"
          className="btn btn-primary btn-full"
          disabled={isLoading || !transcript.trim()}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Analyzing…
            </>
          ) : (
            <>
              🧠 Analyze Meeting
            </>
          )}
        </button>
      </div>
    </form>
  );
}
