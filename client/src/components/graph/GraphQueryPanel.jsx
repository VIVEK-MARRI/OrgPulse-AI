import { useState, useCallback, useRef } from 'react';
import './graph.css';
import { highlightCypher, SAMPLE_QUESTIONS } from './cypherHighlight.js';

const API_BASE = '';

export default function GraphQueryPanel({ extraction, apiKeyOverride }) {
  // ── Query generation state ──────────────────────────────────────────────────
  const [question, setQuestion]     = useState('');
  const [cypher, setCypher]         = useState('');
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

  // ── Neo4j execution state ───────────────────────────────────────────────────
  const [boltUrl, setBoltUrl]       = useState('bolt://localhost:7687');
  const [neo4jUser, setNeo4jUser]   = useState('neo4j');
  const [neo4jPass, setNeo4jPass]   = useState('');
  const [showNeo4jConfig, setShowNeo4jConfig] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError]     = useState(null);
  const [queryResults, setQueryResults] = useState(null); // { columns, rows }

  // ── Ingest state ────────────────────────────────────────────────────────────
  const [ingestLoading, setIngestLoading] = useState(false);
  const [ingestResult, setIngestResult]   = useState(null);
  const [ingestError, setIngestError]     = useState(null);

  const inputRef = useRef(null);

  // ── Generate Cypher from question ───────────────────────────────────────────
  const generateCypher = useCallback(async (q) => {
    const q2 = (q || question).trim();
    if (!q2) return;
    setQueryLoading(true);
    setQueryError(null);
    setCypher('');
    setQueryResults(null);

    try {
      const res = await fetch(`${API_BASE}/api/cypher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q2, apiKeyOverride }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Error ${res.status}`);
      setCypher(json.query || '');
    } catch (err) {
      setQueryError(err.message);
    } finally {
      setQueryLoading(false);
    }
  }, [question, apiKeyOverride]);

  // ── Run Cypher on Neo4j ─────────────────────────────────────────────────────
  const runQuery = useCallback(async () => {
    if (!cypher) return;
    setRunLoading(true);
    setRunError(null);
    setQueryResults(null);

    try {
      const res = await fetch(`${API_BASE}/api/neo4j/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cypher, boltUrl, username: neo4jUser, password: neo4jPass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Neo4j error ${res.status}`);
      setQueryResults({ columns: json.columns, rows: json.rows });
    } catch (err) {
      setRunError(err.message);
    } finally {
      setRunLoading(false);
    }
  }, [cypher, boltUrl, neo4jUser, neo4jPass]);

  // ── Push extraction to Neo4j knowledge graph ────────────────────────────────
  const pushToGraph = useCallback(async () => {
    if (!extraction) return;
    setIngestLoading(true);
    setIngestError(null);
    setIngestResult(null);

    const meetingId = `meeting_${Date.now()}`;
    try {
      const res = await fetch(`${API_BASE}/api/neo4j/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extractionData: extraction,
          meetingId,
          boltUrl,
          username: neo4jUser,
          password: neo4jPass,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Neo4j error ${res.status}`);
      setIngestResult(json);
    } catch (err) {
      setIngestError(err.message);
    } finally {
      setIngestLoading(false);
    }
  }, [extraction, boltUrl, neo4jUser, neo4jPass]);

  // ── Copy query ──────────────────────────────────────────────────────────────
  const copyQuery = useCallback(async () => {
    if (!cypher) return;
    try {
      await navigator.clipboard.writeText(cypher);
    } catch {
      const el = document.createElement('textarea');
      el.value = cypher;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedQuery(true);
    setTimeout(() => setCopiedQuery(false), 2000);
  }, [cypher]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      generateCypher();
    }
  };

  const useSampleQuestion = (q) => {
    setQuestion(q);
    generateCypher(q);
    inputRef.current?.focus();
  };

  return (
    <div className="graph-panel">
      {/* ── Neo4j Connection Config ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              🔗 Knowledge Graph Query
            </span>
          </div>
          <button
            id="btn-neo4j-config"
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowNeo4jConfig(s => !s)}
            style={{ fontSize: '0.75rem' }}
          >
            ⚙ Neo4j {showNeo4jConfig ? '▲' : '▼'}
          </button>
        </div>

        {showNeo4jConfig && (
          <div className="neo4j-config" style={{ marginBottom: '0.75rem' }}>
            <div className="form-group neo4j-config-full">
              <label className="form-label" htmlFor="neo4j-url">Bolt URL</label>
              <input id="neo4j-url" type="text" className="form-input"
                value={boltUrl} onChange={e => setBoltUrl(e.target.value)}
                placeholder="bolt://localhost:7687" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="neo4j-user">Username</label>
              <input id="neo4j-user" type="text" className="form-input"
                value={neo4jUser} onChange={e => setNeo4jUser(e.target.value)}
                placeholder="neo4j" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="neo4j-pass">Password</label>
              <input id="neo4j-pass" type="password" className="form-input"
                value={neo4jPass} onChange={e => setNeo4jPass(e.target.value)}
                placeholder="••••••" />
            </div>
          </div>
        )}
      </div>

      {/* ── Push to Graph Banner (shown when extraction available) ── */}
      {extraction && (
        <div className="push-banner">
          <span className="push-banner-icon">🧩</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Push this meeting to the knowledge graph
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Creates nodes for tasks, risks, people, escalations, and decisions in Neo4j.
            </div>
          </div>
          <button
            id="btn-push-graph"
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={pushToGraph}
            disabled={ingestLoading}
            style={{ flexShrink: 0 }}
          >
            {ingestLoading ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Pushing…</> : '⬆ Push'}
          </button>
        </div>
      )}

      {/* Ingest result */}
      {ingestResult && (
        <div className={`ingest-result ${ingestResult.errors > 0 ? 'has-errors' : ''}`}>
          {ingestResult.errors === 0 ? '✓' : '⚠'}
          <span>
            Ingested <strong>{ingestResult.statementsRun}</strong> statements
            {ingestResult.errors > 0 ? ` (${ingestResult.errors} errors)` : ' successfully.'}
          </span>
        </div>
      )}
      {ingestError && (
        <div className="error-banner" role="alert">
          <span className="error-banner-icon">⚠</span>
          <span>Neo4j ingest failed: {ingestError}</span>
        </div>
      )}

      {/* ── Natural Language Question Input ── */}
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          Ask a question about your organizational data
        </div>
        <div className="graph-question-area">
          <textarea
            id="graph-question-input"
            ref={inputRef}
            className="graph-question-input"
            placeholder='e.g. "Who owns the most pending tasks?" — Ctrl+Enter to generate'
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            spellCheck={false}
          />
          <button
            id="btn-generate-cypher"
            type="button"
            className="btn btn-primary"
            onClick={() => generateCypher()}
            disabled={queryLoading || !question.trim()}
            style={{ flexShrink: 0, height: 52 }}
          >
            {queryLoading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generating…</>
              : '⚡ Generate'}
          </button>
        </div>

        {queryError && (
          <div className="error-banner" style={{ marginTop: '0.5rem' }} role="alert">
            <span className="error-banner-icon">⚠</span>
            <span>{queryError}</span>
          </div>
        )}
      </div>

      {/* ── Sample Question Chips ── */}
      <div>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
          Quick examples
        </div>
        <div className="sample-chips">
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={i}
              type="button"
              className="sample-chip"
              onClick={() => useSampleQuestion(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Generated Cypher Block ── */}
      {cypher && (
        <div>
          <div className="cypher-block">
            <div className="cypher-block-toolbar">
              <span className="cypher-label">Generated Cypher</span>
              <div className="flex gap-2">
                <button
                  id="btn-copy-cypher"
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={copyQuery}
                  style={{ fontSize: '0.72rem' }}
                >
                  {copiedQuery ? '✓ Copied' : '⎘ Copy'}
                </button>
                <button
                  id="btn-run-cypher"
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={runQuery}
                  disabled={runLoading}
                >
                  {runLoading
                    ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Running…</>
                    : '▶ Run on Neo4j'}
                </button>
              </div>
            </div>
            <div
              className="cypher-content"
              dangerouslySetInnerHTML={{ __html: highlightCypher(cypher) }}
              aria-label="Generated Cypher query"
            />
          </div>

          {runError && (
            <div className="error-banner" style={{ marginTop: '0.5rem' }}>
              <span className="error-banner-icon">⚠</span>
              <span>{runError}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Query Results Table ── */}
      {queryResults && (
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Results — {queryResults.rows.length} row{queryResults.rows.length !== 1 ? 's' : ''}
          </div>
          {queryResults.rows.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-icon">📭</span>
              Query returned no results
            </div>
          ) : (
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    {queryResults.columns.map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {queryResults.rows.map((row, i) => (
                    <tr key={i}>
                      {queryResults.columns.map(col => (
                        <td key={col} title={String(row[col] ?? '')}>
                          {row[col] === null || row[col] === undefined
                            ? <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>null</span>
                            : typeof row[col] === 'object'
                              ? JSON.stringify(row[col])
                              : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Empty / intro state ── */}
      {!cypher && !queryLoading && (
        <div className="empty-state" style={{ paddingTop: '0.5rem' }}>
          <span className="empty-state-icon" style={{ fontSize: '2rem' }}>🔍</span>
          <span>
            Ask a question above to generate a Cypher query. <br />
            Connect Neo4j to run it live against your knowledge graph.
          </span>
        </div>
      )}
    </div>
  );
}
