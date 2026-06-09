import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import ResultsView from '../components/ResultsView.jsx';
import { SAMPLE_TRANSCRIPT, SAMPLE_MEETING_TITLE, SAMPLE_REFERENCE_DATE } from '../lib/sampleData.js';
import { DEMO_MEETINGS } from '../lib/sampleData.js';

export default function Meetings() {
  const { analyze, extraction, brief, recurring, status, error, reset } = useAnalyzeHook();
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

  const isLoading = ['analyzing', 'briefing', 'recurring'].includes(status);

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
    analyze({ transcript, meetingTitle, referenceDate, apiKeyOverride });
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  const statusText =
    status === 'analyzing' ? 'Extracting data...'
    : status === 'briefing' ? 'Generating brief...'
    : status === 'recurring' ? 'Scanning org memory...'
    : null;

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Analyze meeting transcripts to extract structured intelligence"
      >
        {extraction && (
          <button className="btn btn-ghost btn-sm" onClick={reset}>New Analysis</button>
        )}
      </PageHeader>

      <div className="meetings-layout">
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="input-panel-header">
              <span className="input-panel-title">Transcript</span>
              <div className="flex gap-2 items-center">
                <div className="settings-popover-wrap" ref={settingsRef}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setShowSettings(s => !s)}
                  >
                    Settings
                  </button>
                  {showSettings && (
                    <div className="settings-popover">
                      <div className="settings-popover-title">Settings</div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="api-key-input">API Key Override</label>
                        <input
                          id="api-key-input"
                          type="password"
                          className="form-input"
                          placeholder="Optional request override"
                          value={apiKeyOverride}
                          onChange={e => setApiKeyOverride(e.target.value)}
                          autoComplete="off"
                          spellCheck={false}
                        />
                        <span className="form-help">Used only for this request.</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="settings-popover-wrap" ref={samplesRef}>
                  <button
                    type="button"
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
                      <div className="sample-menu-note">Analyze A, B, and C in sequence to test recurring risk detection.</div>
                      {DEMO_MEETINGS.map(m => (
                        <button key={m.id} type="button" onClick={() => loadSample(m.id)} className="sample-menu-item">
                          <span className="sample-menu-title">Meeting {m.id}: {m.title.split(' - ')[0].trim()}</span>
                          <span className="sample-menu-description">{m.referenceDate}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="input-panel-body" style={{ flex: 1 }}>
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

                <div className="form-group form-group-fill" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div className="flex justify-between items-center">
                    <label className="form-label" htmlFor="transcript-input">Transcript</label>
                    {wordCount > 0 && (
                      <span className="form-help">{wordCount.toLocaleString()} words</span>
                    )}
                  </div>
                  <textarea
                    id="transcript-input"
                    className="form-textarea transcript-textarea"
                    style={{ flex: 1 }}
                    placeholder="Paste a meeting transcript here, or load a sample."
                    value={transcript}
                    onChange={e => setTranscript(e.target.value)}
                    required
                    spellCheck={false}
                  />
                </div>

                {error && (
                  <div className="error-banner" role="alert">
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <div className="input-panel-footer">
                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={isLoading || !transcript.trim()}
                >
                  {isLoading ? (
                    <><span className="spinner" /> {statusText || 'Analyzing...'}</>
                  ) : (
                    'Analyze Meeting'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-body" style={{ flex: 1, overflow: 'auto' }}>
            <ResultsView
              data={extraction}
              brief={brief}
              briefStatus={status}
              recurring={recurring}
              recurringStatus={status}
              apiKeyOverride={apiKeyOverride}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function useAnalyzeHook() {
  const [status, setStatus] = useState('idle');
  const [extraction, setExtraction] = useState(() => {
    try {
      const stored = localStorage.getItem('orgpulse_last_analysis');
      if (stored) return JSON.parse(stored).extraction || null;
    } catch { /* no stored data */ }
    return null;
  });
  const [brief, setBrief] = useState(() => {
    try {
      const stored = localStorage.getItem('orgpulse_last_analysis');
      if (stored) return JSON.parse(stored).brief || null;
    } catch { /* no stored data */ }
    return null;
  });
  const [recurring, setRecurring] = useState(null);
  const [error, setError] = useState(null);

  const persist = (ext, brf) => {
    try {
      localStorage.setItem('orgpulse_last_analysis', JSON.stringify({ extraction: ext, brief: brf }));
    } catch { /* localStorage unavailable */ }
  };

  const analyze = async ({ transcript, meetingTitle, referenceDate, apiKeyOverride }) => {
    setStatus('analyzing');
    setExtraction(null);
    setBrief(null);
    setRecurring(null);
    setError(null);

    try {
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, meetingTitle, referenceDate, apiKeyOverride }),
      });
      const analyzeJson = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeJson.message || `Server error ${analyzeRes.status}`);
      if (!analyzeJson.success || !analyzeJson.data) throw new Error('Unexpected response from /api/analyze.');

      const extractionData = analyzeJson.data;
      setExtraction(extractionData);
      persist(extractionData, null);

      setStatus('briefing');
      try {
        const briefRes = await fetch('/api/brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extractionData, apiKeyOverride }),
        });
        const briefJson = await briefRes.json();
        if (briefRes.ok && briefJson.success && briefJson.data) {
          setBrief(briefJson.data);
          persist(extractionData, briefJson.data);
        }
      } catch (briefErr) {
        console.warn('[OrgPulse] Brief stage failed (non-fatal):', briefErr.message);
      }

      setStatus('recurring');
      try {
        const recurRes = await fetch('/api/recurring/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extractionData, apiKeyOverride }),
        });
        const recurJson = await recurRes.json();
        if (recurRes.ok && recurJson.success) {
          setRecurring(recurJson.recurringIssues || []);
        }
      } catch (recurErr) {
        console.warn('[OrgPulse] Recurring stage failed (non-fatal):', recurErr.message);
        setRecurring([]);
      }

      setStatus('success');
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the OrgPulse server. Make sure it is running on port 3001.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setExtraction(null);
    setBrief(null);
    setRecurring(null);
    setError(null);
    try { localStorage.removeItem('orgpulse_last_analysis'); } catch { /* ignore */ }
  };

  return { analyze, extraction, brief, recurring, status, error, reset };
}
