import { useState, useCallback, useRef } from 'react';


// Vite's dev server proxies /api/* to http://localhost:3001 — no base needed
const API_BASE = '';

/**
 * Five-stage OrgPulse AI pipeline:
 *   Stage 1: POST /api/analyze          → structured extraction JSON
 *   Stage 2: POST /api/brief            → executive briefing JSON
 *   Stage 3: POST /api/recurring/analyze → recurring issue intelligence
 *
 * status flow: idle → analyzing → briefing → recurring → success | error
 */
export function useAnalyze() {
  const [status,     setStatus]     = useState('idle');
  const [extraction, setExtraction] = useState(null);
  const [brief,      setBrief]      = useState(null);
  const [recurring,  setRecurring]  = useState(null);
  const [error,      setError]      = useState(null);

  const runningRef = useRef(false);
  const abortRef = useRef(null);

  const analyze = useCallback(async ({
    transcript, meetingTitle, referenceDate, apiKeyOverride,
  }) => {
    // Prevent duplicate concurrent pipeline runs
    if (runningRef.current) return;

    runningRef.current = true;
    setError(null);

    // Abort any in-flight pipeline
    if (abortRef.current) abortRef.current.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setStatus('analyzing');
    setExtraction(null);
    setBrief(null);
    setRecurring(null);
    setError(null);

    try {
      // ── Stage 1: Extract ──────────────────────────────────────────────────
      const analyzeRes  = await fetch(`${API_BASE}/api/analyze`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ transcript, meetingTitle, referenceDate, apiKeyOverride }),
        signal:  abortController.signal,
      });
      const analyzeJson = await analyzeRes.json();


      if (!analyzeRes.ok)
        throw new Error(analyzeJson.message || `Server error ${analyzeRes.status}`);
      if (!analyzeJson.success || !analyzeJson.data)
        throw new Error('Unexpected response from /api/analyze.');

      const extractionData = analyzeJson.data;
      setExtraction(extractionData);

      // ── Stage 2: Executive Brief (non-fatal) ─────────────────────────────
      setStatus('briefing');

      try {
        const briefRes  = await fetch(`${API_BASE}/api/brief`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ extractionData, apiKeyOverride }),
          signal:  abortController.signal,
        });

        const briefJson = await briefRes.json();
        if (briefRes.ok && briefJson.success && briefJson.data) {
          setBrief(briefJson.data);
        }
      } catch (briefErr) {
        console.warn('[OrgPulse] Brief stage failed (non-fatal):', briefErr.message);
      }

      // ── Stage 3: Recurring Issue Intelligence (non-fatal) ─────────────────
      setStatus('recurring');

      try {
        const recurRes  = await fetch(`${API_BASE}/api/recurring/analyze`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ extractionData, apiKeyOverride }),
          signal:  abortController.signal,
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
      if (err?.name === 'AbortError') {
        // User triggered a new analysis or component unmounted.
        setStatus('idle');
        return;
      }
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the OrgPulse server. Make sure it is running on port 3001.');
      } else {
        setError(err.message || 'An unexpected error occurred.');
      }
      setStatus('error');
    } finally {
      runningRef.current = false;
    }
  }, []);


  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = null;
    runningRef.current = false;
    setStatus('idle');
    setExtraction(null);
    setBrief(null);
    setRecurring(null);
    setError(null);
  }, []);


  return { analyze, extraction, brief, recurring, status, error, reset };
}
