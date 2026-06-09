import { useState, useCallback } from 'react';

// Vite's dev server proxies /api/* to http://localhost:3001 — no base needed
const API_BASE = '';

/**
 * Custom hook managing the two-stage OrgPulse AI pipeline:
 *   Stage 1: POST /api/analyze  → structured extraction JSON
 *   Stage 2: POST /api/brief    → executive briefing JSON (auto-chained)
 *
 * @returns {{ analyze, extraction, brief, status, briefStatus, error, reset }}
 */
export function useAnalyze() {
  const [status, setStatus]           = useState('idle');  // 'idle' | 'analyzing' | 'briefing' | 'success' | 'error'
  const [extraction, setExtraction]   = useState(null);
  const [brief, setBrief]             = useState(null);
  const [error, setError]             = useState(null);

  const analyze = useCallback(async ({ transcript, meetingTitle, referenceDate, apiKeyOverride }) => {
    setStatus('analyzing');
    setExtraction(null);
    setBrief(null);
    setError(null);

    try {
      // ── Stage 1: Extract structured data ──────────────────────────────
      const analyzeRes = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, meetingTitle, referenceDate, apiKeyOverride }),
      });

      const analyzeJson = await analyzeRes.json();

      if (!analyzeRes.ok) {
        throw new Error(analyzeJson.message || `Server error: ${analyzeRes.status}`);
      }
      if (!analyzeJson.success || !analyzeJson.data) {
        throw new Error('Unexpected response format from /api/analyze.');
      }

      const extractionData = analyzeJson.data;
      setExtraction(extractionData);

      // ── Stage 2: Generate executive briefing ──────────────────────────
      setStatus('briefing');

      const briefRes = await fetch(`${API_BASE}/api/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extractionData, apiKeyOverride }),
      });

      const briefJson = await briefRes.json();

      if (!briefRes.ok) {
        // Brief failure is non-fatal — we still show the extraction dashboard
        console.warn('[OrgPulse] Executive brief failed:', briefJson.message);
        setBrief(null);
      } else if (briefJson.success && briefJson.data) {
        setBrief(briefJson.data);
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
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setExtraction(null);
    setBrief(null);
    setError(null);
  }, []);

  return { analyze, extraction, brief, status, error, reset };
}
