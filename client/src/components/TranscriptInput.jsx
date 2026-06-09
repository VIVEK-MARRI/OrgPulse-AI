import { useState, useRef, useEffect } from 'react';
import { SAMPLE_TRANSCRIPT, SAMPLE_MEETING_TITLE, SAMPLE_REFERENCE_DATE } from '../data/SampleTranscript.js';
import { DEMO_MEETINGS } from '../data/SampleMeetings.js';

export default function TranscriptInput({ onAnalyze, isLoading, status, error, onApiKeyChange }) {
  const [transcript, setTranscript] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [apiKeyOverride, setApiKeyOverride] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showSamples, setShowSamples] = useState(false);

  const settingsRef = useRef(null);
  const samplesRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setShowSettings(false);
      if (samplesRef.current && !samplesRef.current.contains(e.target)) setShowSamples(false);
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
      const meeting = DEMO_MEETINGS.find(d => d.id === id);
      if (meeting) {
        setTranscript(meeting.transcript);
        setMeetingTitle(meeting.title);
        setReferenceDate(meeting.referenceDate);
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
    status === 'analyzing' ? 'Extracting data...'
    : status === 'briefing' ? 'Generating brief...'
    : status === 'recurring' ? 'Scanning org memory...'
    : null;

  return (
    <form onSubmit={handleSubmit} className="input-form">
      <div className="input-panel-header">
        <span className="input-panel-title">Transcript</span>

        <div className="flex gap-2 items-center">
          <div className="settings-popover-wrap" ref={settingsRef}>
            <button
              type="button"
              id="btn-settings"
              className="btn btn-ghost btn-icon"
              onClick={() => setShowSettings(s => !s)}
              aria-label="Settings"
              title="API key settings"
            >
              Settings
            </button>
            {showSettings && (
              <div className="settings-popover" role="dialog" aria-label="Settings">
                <div className="settings-popover-title">Settings</div>
                <div className="form-group">
                  <label className="form-label" htmlFor="api-key-input">Gemini API Key Override</label>
                  <input
                    id="api-key-input"
                    type="password"
                    className="form-input"
                    placeholder="Optional request override"
                    value={apiKeyOverride}
                    onChange={e => {
                      setApiKeyOverride(e.target.value);
                      onApiKeyChange?.(e.target.value);
                    }}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <span className="form-help">Used only for this request. Not stored.</span>
                </div>
              </div>
            )}
          </div>

          <div className="settings-popover-wrap" ref={samplesRef}>
            <button
              type="button"
              id="btn-load-sample"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSamples(s => !s)}
            >
              Samples
            </button>

            {showSamples && (
              <div className="sample-menu">
                <button type="button" onClick={() => loadSample('phoenix')} className="sample-menu-item">
                  <span className="sample-menu-title">Phoenix Platform Sync</span>
                  <span className="sample-menu-description">General purpose sample transcript</span>
                </button>

                <div className="sample-menu-section">Org Memory Demo Series</div>
                <div className="sample-menu-note">
                  Analyze A, B, and C in sequence to test recurring risk detection.
                </div>

                {DEMO_MEETINGS.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => loadSample(m.id)}
                    className="sample-menu-item"
                  >
                    <span className="sample-menu-title">Meeting {m.id}: {m.title.split(' - ')[0].trim()}</span>
                    <span className="sample-menu-description">{m.referenceDate}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="input-panel-body">
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

        <div className="form-group form-group-fill">
          <div className="flex justify-between items-center">
            <label className="form-label" htmlFor="transcript-input">Transcript</label>
            {wordCount > 0 && (
              <span className="form-help">{wordCount.toLocaleString()} words</span>
            )}
          </div>
          <textarea
            id="transcript-input"
            className="form-textarea transcript-textarea"
            placeholder="Paste a meeting transcript here, or load a sample."
            value={transcript}
            onChange={e => setTranscript(e.target.value)}
            required
            spellCheck={false}
          />
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <span className="error-banner-icon" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="input-panel-footer">
        <button
          id="btn-analyze"
          type="submit"
          className="btn btn-primary btn-full"
          disabled={isLoading || !transcript.trim()}
          aria-busy={isLoading}
        >
          {isLoading ? (
            <><span className="spinner" aria-hidden="true" /> {statusText || 'Analyzing...'}</>
          ) : (
            'Analyze Meeting'
          )}
        </button>
      </div>
    </form>
  );
}
