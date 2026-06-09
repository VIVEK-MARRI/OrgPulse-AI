import { useState, useCallback } from 'react';

// Vite's dev server proxies /api/* to http://localhost:3001 — no base needed
const API_BASE = '';

/**
 * Custom hook for calling the OrgPulse AI analysis endpoint.
 * @returns {{ analyze, result, status, error, reset }}
 */
export function useAnalyze() {
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = useCallback(async ({ transcript, meetingTitle, referenceDate, apiKeyOverride }) => {
    setStatus('loading');
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, meetingTitle, referenceDate, apiKeyOverride }),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Server error: ${response.status}`);
      }

      if (!json.success || !json.data) {
        throw new Error('Unexpected response format from server.');
      }

      setResult(json.data);
      setStatus('success');
    } catch (err) {
      // Distinguish network errors (server not running) from API errors
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
    setResult(null);
    setError(null);
  }, []);

  return { analyze, result, status, error, reset };
}
